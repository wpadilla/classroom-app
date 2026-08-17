import React, { useMemo } from 'react';
import { Alert, Button, Col, Form, FormGroup, FormText, Input, Label, Row } from 'reactstrap';
import { Dialog } from '../../../components/common/Dialog';
import { IClassroom, IProgram, IUser } from '../../../models';
import {
  ACADEMIC_LEVEL_OPTIONS,
  COUNTRIES,
  DOCUMENT_TYPE_OPTIONS,
} from '../../../constants/registration.constants';
import {
  UserFilters,
  countActiveUserFilters,
  defaultUserFilters,
} from '../utils/userFilters';

export type { UserFilters } from '../utils/userFilters';
export { defaultUserFilters } from '../utils/userFilters';

interface UserFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: UserFilters;
  onFiltersChange: (newFilters: UserFilters) => void;
  programs: IProgram[];
  classrooms: IClassroom[];
  users: IUser[];
  enrollmentTypes: string[];
}

interface ClassroomFilterOption {
  id: string;
  programId: string;
  name: string;
  isActive: boolean;
  programPosition?: number;
  subject?: string;
  archivedOnly: boolean;
}

const RangeFields: React.FC<{
  label: string;
  minimum: string;
  maximum: string;
  minKey: keyof UserFilters;
  maxKey: keyof UserFilters;
  onChange: (key: keyof UserFilters, value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
}> = ({ label, minimum, maximum, minKey, maxKey, onChange, min = 0, max, step = 1, help }) => (
  <FormGroup className="mb-3">
    <Label className="small fw-semibold">{label}</Label>
    <Row className="g-2">
      <Col xs={6}>
        <Input
          type="number"
          min={min}
          max={max}
          step={step}
          value={minimum}
          placeholder="Mínimo"
          aria-label={`${label}: mínimo`}
          onChange={(event) => onChange(minKey, event.target.value)}
        />
      </Col>
      <Col xs={6}>
        <Input
          type="number"
          min={min}
          max={max}
          step={step}
          value={maximum}
          placeholder="Máximo"
          aria-label={`${label}: máximo`}
          onChange={(event) => onChange(maxKey, event.target.value)}
        />
      </Col>
    </Row>
    {help && <FormText>{help}</FormText>}
  </FormGroup>
);

const SectionTitle: React.FC<{ icon: string; children: React.ReactNode }> = ({ icon, children }) => (
  <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">
    <i className={`bi bi-${icon} me-2`} />
    {children}
  </h6>
);

export const UserFiltersModal: React.FC<UserFiltersModalProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  programs,
  classrooms,
  users,
  enrollmentTypes,
}) => {
  const classroomOptions = useMemo(() => {
    const options = new Map<string, ClassroomFilterOption>();
    classrooms.forEach((classroom) => {
      options.set(classroom.id, {
        id: classroom.id,
        programId: classroom.programId,
        name: classroom.name || classroom.subject,
        subject: classroom.subject,
        isActive: classroom.isActive,
        programPosition: classroom.programPosition,
        archivedOnly: false,
      });
    });
    users.forEach((user) => {
      [...(user.completedClassrooms || []), ...(user.taughtClassrooms || [])].forEach((history) => {
        if (!options.has(history.classroomId)) {
          options.set(history.classroomId, {
            id: history.classroomId,
            programId: history.programId,
            name: history.classroomName,
            isActive: false,
            archivedOnly: true,
          });
        }
      });
    });
    return Array.from(options.values());
  }, [classrooms, users]);

  const sortedClassroomOptions = useMemo(
    () =>
      [...classroomOptions].sort((left, right) => {
        const programDifference = left.programId.localeCompare(right.programId);
        if (programDifference !== 0) return programDifference;
        return (left.programPosition || 0) - (right.programPosition || 0) ||
          left.name.localeCompare(right.name, 'es');
      }),
    [classroomOptions]
  );

  const visibleClassrooms = useMemo(
    () =>
      sortedClassroomOptions.filter(
        (classroom) => !filters.programId || classroom.programId === filters.programId
      ),
    [filters.programId, sortedClassroomOptions]
  );

  const programById = useMemo(
    () => new Map(programs.map((program) => [program.id, program])),
    [programs]
  );

  const handleChange = (key: keyof UserFilters, value: string) => {
    const nextFilters = { ...filters, [key]: value } as UserFilters;
    if (key === 'programId' && filters.classroomId) {
      const selectedClassroom = classroomOptions.find((classroom) => classroom.id === filters.classroomId);
      if (selectedClassroom && selectedClassroom.programId !== value) {
        nextFilters.classroomId = '';
      }
    }
    onFiltersChange(nextFilters);
  };

  const activeFilterCount = countActiveUserFilters(filters);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Filtros inteligentes de usuarios"
      size="xl"
      fullScreen
      footer={(
        <div className="d-flex gap-2 w-100 justify-content-end">
          {activeFilterCount > 0 && (
            <Button color="light" onClick={() => onFiltersChange(defaultUserFilters)}>
              <i className="bi bi-arrow-counterclockwise me-2" />
              Limpiar ({activeFilterCount})
            </Button>
          )}
          <Button color="primary" onClick={onClose}>
            Mostrar resultados
          </Button>
        </div>
      )}
    >
      <Form>
        <Alert color="info" className="small">
          Los filtros se combinan entre sí. El índice general promedia las clases finalizadas y
          las evaluaciones actuales marcadas como evaluadas, sin duplicar una misma clase.
        </Alert>

        <Row className="g-4">
          <Col lg={6}>
            <SectionTitle icon="diagram-3">Relación con programas y clases</SectionTitle>

            <FormGroup>
              <Label className="small fw-semibold">Programa académico</Label>
              <Input
                type="select"
                value={filters.programId}
                onChange={(event) => handleChange('programId', event.target.value)}
              >
                <option value="">Cualquier programa</option>
                {[...programs]
                  .sort((left, right) => left.name.localeCompare(right.name, 'es'))
                  .map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}{program.isActive ? '' : ' (inactivo)'}
                    </option>
                  ))}
              </Input>
            </FormGroup>

            <FormGroup>
              <Label className="small fw-semibold">Clase específica</Label>
              <Input
                type="select"
                value={filters.classroomId}
                onChange={(event) => handleChange('classroomId', event.target.value)}
              >
                <option value="">Cualquier clase{filters.programId ? ' del programa' : ''}</option>
                {visibleClassrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {filters.programId ? '' : `${programById.get(classroom.programId)?.name || 'Sin programa'} — `}
                    {classroom.subject} | {classroom.name}
                    {classroom.archivedOnly ? ' (solo historial)' : classroom.isActive ? ' (activa)' : ' (cerrada)'}
                  </option>
                ))}
              </Input>
            </FormGroup>

            <FormGroup>
              <Label className="small fw-semibold">Vínculo con la clase o programa</Label>
              <Input
                type="select"
                value={filters.academicRelationship}
                onChange={(event) => handleChange('academicRelationship', event.target.value)}
              >
                <optgroup label="Como estudiante">
                  <option value="student-current-or-history">La está cursando o la cursó</option>
                  <option value="student-current">La está cursando ahora</option>
                  <option value="student-history">La cursó anteriormente (cualquier resultado)</option>
                  <option value="student-completed">La aprobó o completó</option>
                  <option value="student-failed">La reprobó</option>
                  <option value="student-dropped">La abandonó</option>
                </optgroup>
                <optgroup label="Como profesor">
                  <option value="teacher-current-or-history">La imparte o la impartió</option>
                  <option value="teacher-current">La imparte actualmente</option>
                  <option value="teacher-history">La impartió anteriormente</option>
                </optgroup>
                <option value="any-involvement">Cualquier vínculo académico</option>
              </Input>
              <FormText>
                Sin elegir programa o clase, una opción distinta de la predeterminada busca ese
                vínculo en toda la trayectoria del usuario.
              </FormText>
            </FormGroup>

            <FormGroup>
              <Label for="missingClassroomId" className="small fw-semibold">
                Le falta esta clase (no la aprobó, no la ha cursado o la está cursando)
              </Label>
              <Input
                id="missingClassroomId"
                type="select"
                value={filters.missingClassroomId}
                onChange={(event) => handleChange('missingClassroomId', event.target.value)}
              >
                <option value="">No aplicar este filtro</option>
                {sortedClassroomOptions.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {programById.get(classroom.programId)?.name || 'Sin programa'} — {classroom.name}
                    {classroom.archivedOnly ? ' (solo historial)' : classroom.isActive ? ' (activa)' : ' (cerrada)'}
                  </option>
                ))}
              </Input>
              <FormText>
                Este selector es independiente de “Programa académico”, “Clase específica” y
                “Vínculo con la clase o programa”.
              </FormText>
            </FormGroup>

            <Row className="g-2">
              <Col md={6}>
                <FormGroup>
                  <Label className="small fw-semibold">Historial académico</Label>
                  <Input
                    type="select"
                    value={filters.historyStatus}
                    onChange={(event) => handleChange('historyStatus', event.target.value)}
                  >
                    <option value="all">Con o sin trayectoria</option>
                    <option value="no-history">Nunca ha cursado clases</option>
                    <option value="has-history">Cursa o cursó alguna clase</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="small fw-semibold">Resultado histórico</Label>
                  <Input
                    type="select"
                    value={filters.historyOutcome}
                    onChange={(event) => handleChange('historyOutcome', event.target.value)}
                  >
                    <option value="all">Cualquier resultado</option>
                    <option value="completed">Al menos una completada/aprobada</option>
                    <option value="failed">Al menos una reprobada</option>
                    <option value="dropped">Al menos una abandonada</option>
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <Row className="g-2">
              <Col md={6}>
                <FormGroup>
                  <Label className="small fw-semibold">Inscripciones actuales</Label>
                  <Input
                    type="select"
                    value={filters.activeEnrollments}
                    onChange={(event) => handleChange('activeEnrollments', event.target.value)}
                  >
                    <option value="all">Cualquier cantidad</option>
                    <option value="zero">Ninguna</option>
                    <option value="one-or-more">Una o más</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <RangeFields
                  label="Cantidad exacta/rango de inscripciones"
                  minimum={filters.minActiveEnrollments}
                  maximum={filters.maxActiveEnrollments}
                  minKey="minActiveEnrollments"
                  maxKey="maxActiveEnrollments"
                  onChange={handleChange}
                  min={0}
                />
              </Col>
            </Row>

            <RangeFields
              label="Cantidad de clases en historial"
              minimum={filters.minCompletedClassrooms}
              maximum={filters.maxCompletedClassrooms}
              minKey="minCompletedClassrooms"
              maxKey="maxCompletedClassrooms"
              onChange={handleChange}
              min={0}
              help="Incluye completadas, reprobadas y abandonadas."
            />
          </Col>

          <Col lg={6}>
            <SectionTitle icon="graph-up-arrow">Rendimiento académico</SectionTitle>

            <FormGroup>
              <Label className="small fw-semibold">Disponibilidad de calificaciones</Label>
              <Input
                type="select"
                value={filters.gradeAvailability}
                onChange={(event) => handleChange('gradeAvailability', event.target.value)}
              >
                <option value="all">Con o sin índice</option>
                <option value="with-grade">Solo con índice calculable</option>
                <option value="without-grade">Solo sin calificaciones registradas</option>
              </Input>
            </FormGroup>

            <RangeFields
              label="Índice general (%)"
              minimum={filters.minGeneralIndex}
              maximum={filters.maxGeneralIndex}
              minKey="minGeneralIndex"
              maxKey="maxGeneralIndex"
              onChange={handleChange}
              min={0}
              max={100}
              step={0.1}
              help="Ejemplo: 85–100 para identificar estudiantes de alto rendimiento."
            />

            <RangeFields
              label="Asistencia general (%)"
              minimum={filters.minAttendance}
              maximum={filters.maxAttendance}
              minKey="minAttendance"
              maxKey="maxAttendance"
              onChange={handleChange}
              min={0}
              max={100}
              step={0.1}
              help="Se calcula a partir de todos los registros de asistencia disponibles."
            />

            <FormGroup>
              <Label className="small fw-semibold">Orden de resultados</Label>
              <Input
                type="select"
                value={filters.orderBy}
                onChange={(event) => handleChange('orderBy', event.target.value)}
              >
                <option value="default">Orden original</option>
                <option value="index-desc">Mejor índice primero</option>
                <option value="index-asc">Menor índice primero</option>
                <option value="completed-desc">Más clases completadas primero</option>
                <option value="active-enrollments-desc">Más inscripciones activas primero</option>
                <option value="newest">Usuarios más recientes primero</option>
              </Input>
            </FormGroup>

            <SectionTitle icon="person-vcard">Cuenta y perfil</SectionTitle>

            <Row className="g-2">
              <Col md={6}>
                <FormGroup>
                  <Label className="small fw-semibold">Rol</Label>
                  <Input
                    type="select"
                    value={filters.role}
                    onChange={(event) => handleChange('role', event.target.value)}
                  >
                    <option value="all">Cualquier rol</option>
                    <option value="student">Estudiante</option>
                    <option value="teacher">Profesor</option>
                    <option value="admin">Administrador</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="small fw-semibold">Estado de cuenta</Label>
                  <Input
                    type="select"
                    value={filters.isActive}
                    onChange={(event) => handleChange('isActive', event.target.value)}
                  >
                    <option value="all">Activos e inactivos</option>
                    <option value="true">Solo activos</option>
                    <option value="false">Solo inactivos</option>
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <Row className="g-2">
              <Col md={6}>
                <FormGroup>
                  <Label className="small fw-semibold">Tipo de ingreso</Label>
                  <Input
                    type="select"
                    value={filters.enrollmentType}
                    onChange={(event) => handleChange('enrollmentType', event.target.value)}
                  >
                    <option value="all">Cualquier tipo</option>
                    {enrollmentTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="small fw-semibold">Nivel académico</Label>
                  <Input
                    type="select"
                    value={filters.academicLevel}
                    onChange={(event) => handleChange('academicLevel', event.target.value)}
                  >
                    <option value="all">Cualquier nivel</option>
                    {ACADEMIC_LEVEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <Row className="g-2">
              <Col md={6}>
                <FormGroup>
                  <Label className="small fw-semibold">País</Label>
                  <Input
                    type="select"
                    value={filters.country}
                    onChange={(event) => handleChange('country', event.target.value)}
                  >
                    <option value="">Cualquier país</option>
                    {COUNTRIES.map((country) => (
                      <option key={country.value} value={country.value}>{country.label}</option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="small fw-semibold">Documento</Label>
                  <Input
                    type="select"
                    value={filters.documentType}
                    onChange={(event) => handleChange('documentType', event.target.value)}
                  >
                    <option value="all">Cualquier documento</option>
                    {DOCUMENT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <Row className="g-2">
              <Col md={6}>
                <FormGroup>
                  <Label className="small fw-semibold">Completitud del perfil</Label>
                  <Input
                    type="select"
                    value={filters.profileStatus}
                    onChange={(event) => handleChange('profileStatus', event.target.value)}
                  >
                    <option value="all">Cualquier estado</option>
                    <option value="complete">Perfil académico completo</option>
                    <option value="incomplete">Perfil con datos pendientes</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label className="small fw-semibold">Onboarding estudiantil</Label>
                  <Input
                    type="select"
                    value={filters.onboardingStatus}
                    onChange={(event) => handleChange('onboardingStatus', event.target.value)}
                  >
                    <option value="all">Cualquier estado</option>
                    <option value="completed">Completado</option>
                    <option value="pending">Pendiente</option>
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <FormGroup>
              <Label className="small fw-semibold">Fecha de creación de la cuenta</Label>
              <Row className="g-2">
                <Col xs={6}>
                  <Input
                    type="date"
                    value={filters.createdFrom}
                    aria-label="Cuenta creada desde"
                    onChange={(event) => handleChange('createdFrom', event.target.value)}
                  />
                </Col>
                <Col xs={6}>
                  <Input
                    type="date"
                    value={filters.createdTo}
                    aria-label="Cuenta creada hasta"
                    onChange={(event) => handleChange('createdTo', event.target.value)}
                  />
                </Col>
              </Row>
            </FormGroup>
          </Col>
        </Row>
      </Form>
    </Dialog>
  );
};

export default UserFiltersModal;
