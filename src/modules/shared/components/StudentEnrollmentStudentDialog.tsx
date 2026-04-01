import React from 'react';
import { Alert, Button, Spinner } from 'reactstrap';
import Dialog from '../../../components/common/Dialog';
import { IUser } from '../../../models';
import { UserService } from '../../../services/user/user.service';

interface StudentEnrollmentStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: StudentEnrollmentStudentFormPayload) => Promise<void>;
  allStudents: IUser[];
  enrolledStudentIds: string[];
  initialStudent?: IUser | null;
  classroomName?: string;
  isOffline: boolean;
  isSubmitting: boolean;
}

export interface StudentEnrollmentStudentFormPayload {
  action: 'create' | 'enroll-existing' | 'edit';
  studentId?: string;
  originalStudent?: IUser | null;
  values: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
  };
}

const INITIAL_FORM_STATE = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  password: '',
};

const normalizeText = (value: string): string => value.trim();

const StudentEnrollmentStudentDialog: React.FC<StudentEnrollmentStudentDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  allStudents,
  enrolledStudentIds,
  initialStudent,
  classroomName,
  isOffline,
  isSubmitting,
}) => {
  const isEditMode = Boolean(initialStudent);
  const [formValues, setFormValues] = React.useState(INITIAL_FORM_STATE);
  const [matchedStudent, setMatchedStudent] = React.useState<IUser | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialStudent) {
      setFormValues({
        firstName: initialStudent.firstName || '',
        lastName: initialStudent.lastName || '',
        phone: initialStudent.phone || '',
        email: initialStudent.email || '',
        password: '',
      });
      setMatchedStudent(initialStudent);
      setErrorMessage('');
      setIsSearching(false);
      return;
    }

    setFormValues(INITIAL_FORM_STATE);
    setMatchedStudent(null);
    setErrorMessage('');
    setIsSearching(false);
  }, [initialStudent, isOpen]);

  const normalizedPhone = React.useMemo(
    () => UserService.normalizePhone(formValues.phone),
    [formValues.phone]
  );

  React.useEffect(() => {
    if (!isOpen || isEditMode) {
      return;
    }

    if (normalizedPhone.length < 10) {
      setMatchedStudent(null);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);

      const localMatch =
        allStudents.find(
          (student) => UserService.normalizePhone(student.phone) === normalizedPhone
        ) || null;

      let resolvedMatch = localMatch;

      if (!resolvedMatch && !isOffline) {
        resolvedMatch = await UserService.getUserByPhone(normalizedPhone);
      }

      if (cancelled) {
        return;
      }

      setMatchedStudent(resolvedMatch || null);
      setIsSearching(false);

      if (resolvedMatch) {
        setFormValues((current) => ({
          ...current,
          firstName: resolvedMatch?.firstName || '',
          lastName: resolvedMatch?.lastName || '',
          email: resolvedMatch?.email || '',
          phone: resolvedMatch?.phone || current.phone,
          password: '',
        }));
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [allStudents, isEditMode, isOffline, isOpen, normalizedPhone]);

  const activeStudent = initialStudent || matchedStudent;
  const alreadyEnrolled = activeStudent ? enrolledStudentIds.includes(activeStudent.id) : false;
  const isExistingStudentFlow = Boolean(matchedStudent) && !isEditMode;
  const requiresPassword = !activeStudent;
  const actionType: StudentEnrollmentStudentFormPayload['action'] = isEditMode || alreadyEnrolled
    ? 'edit'
    : isExistingStudentFlow
      ? 'enroll-existing'
      : 'create';

  const submitLabel = isEditMode || alreadyEnrolled
    ? 'Guardar cambios'
    : isExistingStudentFlow
      ? 'Guardar e inscribir'
      : 'Crear e inscribir';

  const helperMessage = isEditMode
    ? 'Actualiza rápidamente los datos del estudiante ya inscrito.'
    : isExistingStudentFlow
      ? alreadyEnrolled
        ? 'Este estudiante ya está inscrito. Puedes aprovechar este formulario para corregir sus datos.'
        : 'Encontramos un estudiante con ese teléfono. Puedes revisar sus datos y dejarlo inscrito de inmediato.'
      : `Si el teléfono ya existe en la academia, completaremos los datos automáticamente para inscribirlo en ${classroomName || 'esta clase'}.`;

  const handleChange = (field: keyof typeof INITIAL_FORM_STATE, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setErrorMessage('');

    if (field === 'phone' && !isEditMode) {
      const nextPhone = UserService.normalizePhone(value);
      const currentMatchedPhone = matchedStudent ? UserService.normalizePhone(matchedStudent.phone) : '';
      if (currentMatchedPhone && nextPhone !== currentMatchedPhone) {
        setMatchedStudent(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (normalizedPhone.length < 10) {
      setErrorMessage('Ingresa un teléfono o WhatsApp válido de al menos 10 dígitos.');
      return;
    }

    if (!normalizeText(formValues.firstName) || !normalizeText(formValues.lastName)) {
      setErrorMessage('Debes completar nombre y apellido.');
      return;
    }

    if (requiresPassword && !normalizeText(formValues.password)) {
      setErrorMessage('Debes indicar una contraseña para crear el estudiante.');
      return;
    }

    await onSubmit({
      action: actionType,
      studentId: activeStudent?.id,
      originalStudent: activeStudent,
      values: {
        firstName: normalizeText(formValues.firstName),
        lastName: normalizeText(formValues.lastName),
        phone: normalizedPhone,
        email: normalizeText(formValues.email),
        password: normalizeText(formValues.password),
      },
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar estudiante' : 'Crear o inscribir estudiante'}
      size="md"
      fullScreen
      footer={
        <div className="flex gap-2">
          <Button color="secondary" onClick={onClose} disabled={isSubmitting} className="flex-1">
            Cancelar
          </Button>
          <Button color="primary" onClick={() => void handleSubmit()} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="me-2" />
                Guardando...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-[24px] bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-800 p-4 text-white">
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-cyan-200">
            Estudiantes
          </p>
          <h3 className="mb-2 text-lg font-semibold">
            {isEditMode ? 'Actualizar información' : 'Crear, detectar e inscribir'}
          </h3>
          <p className="mb-0 text-sm leading-6 text-slate-200">
            {helperMessage}
          </p>
        </div>

        {!isEditMode && (
          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
            <label htmlFor="student-phone" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Teléfono / WhatsApp
            </label>
            <div className="relative">
              <input
                id="student-phone"
                type="tel"
                value={formValues.phone}
                onChange={(event) => handleChange('phone', event.target.value)}
                placeholder="8090000000"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:bg-white"
              />
              {isSearching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <i className="bi bi-arrow-repeat animate-spin"></i>
                </span>
              )}
            </div>
            <p className="mt-2 mb-0 text-xs text-slate-500">
              Al llegar a 10 dígitos buscaremos si ya existe un estudiante con ese número.
            </p>
          </div>
        )}

        {activeStudent && (
          <Alert color={alreadyEnrolled ? 'info' : 'success'} className="mb-0">
            <div className="flex items-start gap-2">
              <i className={`bi ${alreadyEnrolled ? 'bi-pencil-square' : 'bi-person-check'} mt-0.5`}></i>
              <div>
                <div className="font-semibold">
                  {alreadyEnrolled ? 'Estudiante ya inscrito en esta clase' : 'Estudiante existente encontrado'}
                </div>
                <div className="text-sm">
                  {activeStudent.firstName} {activeStudent.lastName} {alreadyEnrolled ? 'puede actualizar sus datos desde aquí.' : 'será inscrito usando este mismo formulario.'}
                </div>
              </div>
            </div>
          </Alert>
        )}

        {isOffline && activeStudent && !isEditMode && (
          <Alert color="warning" className="mb-0">
            Si modificas los datos de un estudiante existente mientras estás sin conexión, tendrás que repetir esa edición cuando vuelva el internet.
          </Alert>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
            <label htmlFor="student-first-name" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Nombre
            </label>
            <input
              id="student-first-name"
              type="text"
              value={formValues.firstName}
              onChange={(event) => handleChange('firstName', event.target.value)}
              placeholder="Nombre"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:bg-white"
            />
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
            <label htmlFor="student-last-name" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Apellido
            </label>
            <input
              id="student-last-name"
              type="text"
              value={formValues.lastName}
              onChange={(event) => handleChange('lastName', event.target.value)}
              placeholder="Apellido"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:bg-white"
            />
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2">
            <label htmlFor="student-email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Correo electrónico
            </label>
            <input
              autoComplete="new-password"
              id="student-email"
              type="email"
              value={formValues.email}
              onChange={(event) => handleChange('email', event.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:bg-white"
            />
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2">
            <label htmlFor="student-password" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {requiresPassword ? 'Contraseña' : 'Contraseña nueva (opcional)'}
            </label>
            <input
              autoComplete="new-password"
              id="student-password"
              type="password"
              value={formValues.password}
              onChange={(event) => handleChange('password', event.target.value)}
              placeholder={requiresPassword ? 'Contraseña para crear la cuenta' : 'Solo si deseas cambiarla'}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:bg-white"
            />
          </div>
        </div>

        {errorMessage && (
          <Alert color="danger" className="mb-0">
            {errorMessage}
          </Alert>
        )}
      </div>
    </Dialog>
  );
};

export default StudentEnrollmentStudentDialog;
