import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Spinner } from 'reactstrap';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import Dialog from '../../components/common/Dialog';
import { useOffline } from '../../contexts/OfflineContext';
import { IClassroom, IUser } from '../../models';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { UserService } from '../../services/user/user.service';
import { OfflineStorageService } from '../../services/offline/offline-storage.service';
import StudentEnrollmentStudentDialog, {
  StudentEnrollmentStudentFormPayload,
} from './components/StudentEnrollmentStudentDialog';

interface StudentEnrollmentProps {
  classroom: IClassroom;
  onUpdate?: () => void;
}

const StudentEnrollment: React.FC<StudentEnrollmentProps> = ({ classroom, onUpdate }) => {
  const { isOffline, pendingOperations } = useOffline();
  const [allStudents, setAllStudents] = useState<IUser[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableSearchQuery, setAvailableSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<IUser | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      let allStudentsList = await UserService.getUsersByRole('student');

      if (isOffline) {
        const localStudents = OfflineStorageService.getLocalStudents();
        const localStudentIds = localStudents.map((student) => student.id);
        allStudentsList = [
          ...localStudents,
          ...allStudentsList.filter((student) => !localStudentIds.includes(student.id)),
        ];
      }

      let currentStudentIds = classroom.studentIds || [];
      if (isOffline) {
        const localClassroom = OfflineStorageService.getLocalClassroom(classroom.id);
        if (localClassroom?.studentIds) {
          currentStudentIds = localClassroom.studentIds;
        }
      }

      const allStudentsById = new Map(allStudentsList.map((student) => [student.id, student]));
      const enrolledList = currentStudentIds
        .map((studentId) => allStudentsById.get(studentId))
        .filter((student): student is IUser => Boolean(student));

      setAllStudents(allStudentsList);
      setEnrolledStudents(enrolledList);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Error al cargar estudiantes.');
    } finally {
      setLoading(false);
    }
  }, [classroom.id, classroom.studentIds, isOffline]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const enrolledStudentIds = useMemo(
    () => enrolledStudents.map((student) => student.id),
    [enrolledStudents]
  );

  const availableStudents = useMemo(
    () => allStudents.filter((student) => !enrolledStudentIds.includes(student.id)),
    [allStudents, enrolledStudentIds]
  );

  const filteredEnrolledStudents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return enrolledStudents;
    }

    return enrolledStudents.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return (
        fullName.includes(normalizedQuery) ||
        student.phone.toLowerCase().includes(normalizedQuery) ||
        (student.email || '').toLowerCase().includes(normalizedQuery)
      );
    });
  }, [enrolledStudents, searchQuery]);

  const filteredAvailableStudents = useMemo(() => {
    const normalizedQuery = availableSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return availableStudents;
    }

    return availableStudents.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return (
        fullName.includes(normalizedQuery) ||
        student.phone.toLowerCase().includes(normalizedQuery) ||
        (student.email || '').toLowerCase().includes(normalizedQuery)
      );
    });
  }, [availableSearchQuery, availableStudents]);

  const resetStudentDialog = () => {
    setStudentDialogOpen(false);
    setEditingStudent(null);
  };

  const openCreateStudentDialog = () => {
    setEditingStudent(null);
    setStudentDialogOpen(true);
  };

  const openEditStudentDialog = (student: IUser) => {
    setEditingStudent(student);
    setStudentDialogOpen(true);
  };

  const updateLocalClassroomStudents = (studentIds: string[]) => {
    OfflineStorageService.updateClassroomStudentsLocally(classroom.id, studentIds);
    classroom.studentIds = studentIds;
  };

  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Selecciona al menos un estudiante.');
      return;
    }

    try {
      setSaving(true);

      if (isOffline) {
        const currentStudentIds = classroom.studentIds || [];

        for (const studentId of selectedStudents) {
          await OfflineStorageService.saveOperation({
            type: 'addStudentToClassroom',
            data: { classroomId: classroom.id, studentId },
          });

          if (!currentStudentIds.includes(studentId)) {
            currentStudentIds.push(studentId);
          }

          const student = allStudents.find((candidate) => candidate.id === studentId);
          if (student) {
            OfflineStorageService.saveStudentLocally(student);
          }
        }

        updateLocalClassroomStudents(currentStudentIds);
        toast.info('Los estudiantes fueron agregados localmente. Se sincronizarán al volver la conexión.');
      } else {
        for (const studentId of selectedStudents) {
          await ClassroomService.addStudentToClassroom(classroom.id, studentId);
        }

        toast.success(`${selectedStudents.length} estudiante(s) agregado(s) a la clase.`);
      }

      setPickerOpen(false);
      setSelectedStudents([]);
      setAvailableSearchQuery('');
      await loadData();
      await onUpdate?.();
    } catch (error) {
      console.error('Error adding students:', error);
      toast.error('No se pudieron agregar los estudiantes seleccionados.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!window.confirm('¿Deseas remover este estudiante de la clase?')) {
      return;
    }

    try {
      if (isOffline) {
        await OfflineStorageService.saveOperation({
          type: 'removeStudent',
          data: { classroomId: classroom.id, studentId },
        });

        const updatedIds = (classroom.studentIds || []).filter((id) => id !== studentId);
        updateLocalClassroomStudents(updatedIds);
        toast.info('El estudiante se removió localmente y se sincronizará cuando haya internet.');
      } else {
        await ClassroomService.removeStudentFromClassroom(classroom.id, studentId);
        toast.success('Estudiante removido de la clase.');
      }

      await loadData();
      await onUpdate?.();
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error('No se pudo remover el estudiante.');
    }
  };

  const buildStudentUpdates = (
    values: StudentEnrollmentStudentFormPayload['values'],
    originalStudent?: IUser | null
  ): Partial<IUser> => {
    const nextUpdates: Partial<IUser> = {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      email: values.email || '',
    };

    if (values.password) {
      nextUpdates.password = values.password;
    }

    if (!originalStudent) {
      return nextUpdates;
    }

    return Object.entries(nextUpdates).reduce<Partial<IUser>>((updates, [key, value]) => {
      const currentValue = originalStudent[key as keyof IUser];
      if ((currentValue || '') !== value) {
        updates[key as keyof IUser] = value as never;
      }
      return updates;
    }, {});
  };

  const handleStudentDialogSubmit = async (
    payload: StudentEnrollmentStudentFormPayload
  ) => {
    try {
      setSaving(true);

      if (!isOffline) {
        const conflictingUser = await UserService.getUserByPhone(
          payload.values.phone,
          payload.studentId
        );

        if (conflictingUser && payload.action === 'create') {
          toast.error('Ya existe un estudiante con ese teléfono. Revisa la inscripción existente.');
          return;
        }

        if (conflictingUser && payload.action === 'edit') {
          toast.error('Ese teléfono ya pertenece a otro usuario dentro de la plataforma.');
          return;
        }
      }

      if (payload.action === 'edit') {
        if (!payload.studentId) {
          toast.error('No se encontró el estudiante a actualizar.');
          return;
        }

        if (isOffline) {
          toast.error('Para editar datos de un estudiante necesitas conexión a internet.');
          return;
        }

        const updates = buildStudentUpdates(payload.values, payload.originalStudent);
        if (Object.keys(updates).length === 0) {
          toast.info('No había cambios para guardar.');
          resetStudentDialog();
          return;
        }

        await UserService.updateUser(payload.studentId, updates);
        toast.success('Datos del estudiante actualizados.');
      }

      if (payload.action === 'enroll-existing') {
        if (!payload.studentId) {
          toast.error('No se encontró el estudiante existente.');
          return;
        }

        const updates = buildStudentUpdates(payload.values, payload.originalStudent);

        if (isOffline) {
          if (Object.keys(updates).length > 0) {
            toast.error('Sin conexión solo puedes inscribir estudiantes existentes sin modificar sus datos.');
            return;
          }

          await OfflineStorageService.saveOperation({
            type: 'addStudentToClassroom',
            data: { classroomId: classroom.id, studentId: payload.studentId },
          });

          const currentStudentIds = classroom.studentIds || [];
          if (!currentStudentIds.includes(payload.studentId)) {
            currentStudentIds.push(payload.studentId);
          }
          updateLocalClassroomStudents(currentStudentIds);
          if (payload.originalStudent) {
            OfflineStorageService.saveStudentLocally(payload.originalStudent);
          }
          toast.info('Estudiante inscrito localmente. Se sincronizará cuando vuelva la conexión.');
        } else {
          if (Object.keys(updates).length > 0) {
            await UserService.updateUser(payload.studentId, updates);
          }
          await ClassroomService.addStudentToClassroom(classroom.id, payload.studentId);
          toast.success('Estudiante inscrito en la clase.');
        }
      }

      if (payload.action === 'create') {
        const studentData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> = {
          firstName: payload.values.firstName,
          lastName: payload.values.lastName,
          phone: payload.values.phone,
          email: payload.values.email || '',
          password: payload.values.password,
          role: 'student',
          isTeacher: false,
          isActive: true,
          enrolledClassrooms: [classroom.id],
          completedClassrooms: [],
          teachingClassrooms: [],
          taughtClassrooms: [],
        };

        if (isOffline) {
          const tempStudentId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
          const tempStudent: IUser = {
            ...studentData,
            id: tempStudentId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await OfflineStorageService.saveOperation({
            type: 'createStudent',
            data: { studentData, classroomId: classroom.id },
          });

          OfflineStorageService.saveStudentLocally(tempStudent);
          const currentStudentIds = classroom.studentIds || [];
          currentStudentIds.push(tempStudentId);
          updateLocalClassroomStudents(currentStudentIds);
          toast.info('Estudiante creado localmente. Se sincronizará cuando haya conexión.');
        } else {
          const studentId = await UserService.createUser(studentData);
          await ClassroomService.addStudentToClassroom(classroom.id, studentId);
          toast.success('Estudiante creado y agregado a la clase.');
        }
      }

      resetStudentDialog();
      await loadData();
      await onUpdate?.();
    } catch (error: any) {
      console.error('Error saving student from dialog:', error);
      toast.error(error.message || 'No se pudo guardar el estudiante.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    );
  };

  if (loading) {
    return (
      <div className="py-10 text-center">
        <Spinner color="primary" />
        <p className="mt-3 mb-0 text-sm text-slate-500">Cargando estudiantes...</p>
      </div>
    );
  }

  return (
    <>
      <div className="px-1 pb-6 -mx-3 -my-3">
        <div className="rounded-b-[28px] bg-gradient-to-br from-blue-900 via-slate-900 to-cyan-800 px-4 pb-5 pt-4 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-cyan-200">
                Gestión de estudiantes
              </p>
              <h2 className="mb-2 text-2xl font-bold">Inscripción de la clase</h2>
              <p className="mb-0 max-w-2xl text-sm leading-6 text-slate-200">
                Administra quién entra a esta clase, corrige datos rápidamente y aprovecha la búsqueda por teléfono para detectar estudiantes existentes.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button color="light" className="rounded-2xl border-0 text-slate-900" onClick={() => setPickerOpen(true)}>
                <i className="bi bi-person-plus me-2"></i>
                Inscribir existente
              </Button>
              <Button color="primary" className="rounded-2xl border border-white/20 bg-white/10" onClick={openCreateStudentDialog}>
                <i className="bi bi-person-badge me-2"></i>
                Nuevo estudiante
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.14em] text-cyan-100">Inscritos</div>
              <div className="mt-1 text-xl font-bold">{enrolledStudents.length}</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.14em] text-cyan-100">Disponibles</div>
              <div className="mt-1 text-xl font-bold">{availableStudents.length}</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.14em] text-cyan-100">Clase</div>
              <div className="mt-1 truncate text-sm font-semibold">{classroom.name}</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.14em] text-cyan-100">Modo</div>
              <div className="mt-1 text-sm font-semibold">{isOffline ? 'Sin conexión' : 'En línea'}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-3 pt-4">
          {isOffline && pendingOperations > 0 && (
            <Alert color="warning" className="mb-0 rounded-4 border-0 shadow-sm">
              <i className="bi bi-wifi-off me-2"></i>
              Hay {pendingOperations} operación(es) pendiente(s) de sincronizar.
            </Alert>
          )}

          <section className="">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                  Estudiantes inscritos
                </p>
                <h3 className="mb-0 text-lg font-semibold text-slate-900">
                  {filteredEnrolledStudents.length} visible{filteredEnrolledStudents.length === 1 ? '' : 's'}
                </h3>
              </div>

              <div className="relative w-full md:max-w-sm">
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar por nombre, teléfono o correo..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:bg-white"
                />
              </div>
            </div>

            {filteredEnrolledStudents.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-500">
                <i className="bi bi-people text-3xl text-slate-300"></i>
                <p className="mt-3 mb-0 text-sm">
                  {enrolledStudents.length === 0
                    ? 'Todavía no hay estudiantes inscritos en esta clase.'
                    : 'No encontramos estudiantes con ese criterio de búsqueda.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 ">
                {filteredEnrolledStudents.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 shadow-sm w-[300px]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {student.profilePhoto ? (
                          <img
                            src={student.profilePhoto}
                            alt={`${student.firstName} ${student.lastName}`}
                            className="h-12 w-12 rounded-2xl object-cover shadow-sm"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-sm font-bold text-blue-700 shadow-sm">
                            {student.firstName?.[0] || ''}
                            {student.lastName?.[0] || ''}
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className="mb-1 truncate text-sm font-semibold text-slate-900">
                            {student.firstName} {student.lastName}
                          </h4>
                          <div className="space-y-1 text-xs text-slate-500">
                            <div className="truncate">
                              <i className="bi bi-phone me-1"></i>
                              {student.phone}
                            </div>
                            <div className="truncate">
                              <i className="bi bi-envelope me-1"></i>
                              {student.email || 'Sin correo electrónico'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-white px-2 text-xs font-bold text-slate-600 shadow-sm">
                        {index + 1}
                      </span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button color="light" className="flex-1 rounded-2xl border border-slate-200 bg-white text-slate-700" onClick={() => openEditStudentDialog(student)}>
                        <i className="bi bi-pencil-square me-2"></i>
                        Editar
                      </Button>
                      <Button color="danger" outline className="rounded-2xl" onClick={() => void handleRemoveStudent(student.id)}>
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <Dialog
        isOpen={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setSelectedStudents([]);
          setAvailableSearchQuery('');
        }}
        title="Inscribir estudiantes existentes"
        size="lg"
        fullScreen
        footer={
          <div className="flex gap-2">
            <Button
              color="secondary"
              onClick={() => {
                setPickerOpen(false);
                setSelectedStudents([]);
                setAvailableSearchQuery('');
              }}
              disabled={saving}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button color="primary" onClick={() => void handleAddStudents()} disabled={saving || selectedStudents.length === 0} className="flex-1">
              {saving ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Inscribiendo...
                </>
              ) : (
                `Agregar (${selectedStudents.length})`
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-[24px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-cyan-500 p-4 text-white">
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-100">
              Inscripción rápida
            </p>
            <h3 className="mb-2 text-lg font-semibold">Selecciona estudiantes disponibles</h3>
            <p className="mb-0 text-sm leading-6 text-emerald-50">
              Marca uno o varios estudiantes que ya existen en la academia para agregarlos inmediatamente a esta clase.
            </p>
          </div>

          <div className="relative">
            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="search"
              value={availableSearchQuery}
              onChange={(event) => setAvailableSearchQuery(event.target.value)}
              placeholder="Buscar estudiantes disponibles..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:bg-white"
            />
          </div>

          {filteredAvailableStudents.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-slate-500">
              <i className="bi bi-person-x text-3xl text-slate-300"></i>
              <p className="mt-3 mb-0 text-sm">
                No hay estudiantes disponibles para inscribir con ese criterio.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredAvailableStudents.map((student, index) => {
                const isSelected = selectedStudents.includes(student.id);

                return (
                  <motion.button
                    key={student.id}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => toggleStudentSelection(student.id)}
                    className={`rounded-[24px] border p-4 text-left shadow-sm transition ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="mb-1 truncate text-sm font-semibold text-slate-900">
                          {student.firstName} {student.lastName}
                        </h4>
                        <p className="mb-1 text-xs text-slate-500">
                          <i className="bi bi-phone me-1"></i>
                          {student.phone}
                        </p>
                        <p className="mb-0 truncate text-xs text-slate-500">
                          <i className="bi bi-envelope me-1"></i>
                          {student.email || 'Sin correo electrónico'}
                        </p>
                      </div>

                      <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500 text-white'
                          : 'border-slate-300 bg-white text-transparent'
                      }`}>
                        <i className="bi bi-check-lg"></i>
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </Dialog>

      <StudentEnrollmentStudentDialog
        isOpen={studentDialogOpen}
        onClose={resetStudentDialog}
        onSubmit={handleStudentDialogSubmit}
        allStudents={allStudents}
        enrolledStudentIds={enrolledStudentIds}
        initialStudent={editingStudent}
        classroomName={classroom.name}
        isOffline={isOffline}
        isSubmitting={saving}
      />
    </>
  );
};

export default StudentEnrollment;
