import React from 'react';
import { Form, FormGroup, Label, Input, Button } from 'reactstrap';
import { Dialog } from '../../../components/common/Dialog';
import { UserRole } from '../../../models/user.model';
import { EnrollmentType } from '../../../models/registration.model';

export interface UserFilters {
  role: UserRole | 'all';
  isActive: string | 'all'; // 'true', 'false', 'all'
  enrollmentType: EnrollmentType | 'all';
  historyStatus: 'all' | 'no-history' | 'has-history';
  activeEnrollments: 'all' | 'zero' | 'one-or-more';
  programId: string;
}

export const defaultUserFilters: UserFilters = {
  role: 'all',
  isActive: 'all',
  enrollmentType: 'all',
  historyStatus: 'all',
  activeEnrollments: 'all',
  programId: '',
};

interface UserFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: UserFilters;
  onFiltersChange: (newFilters: UserFilters) => void;
  programs: { id: string; name: string }[];
}

export const UserFiltersModal: React.FC<UserFiltersModalProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  programs,
}) => {
  const handleChange = (key: keyof UserFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange(defaultUserFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.role !== 'all') count++;
    if (filters.isActive !== 'all') count++;
    if (filters.enrollmentType !== 'all') count++;
    if (filters.historyStatus !== 'all') count++;
    if (filters.activeEnrollments !== 'all') count++;
    if (filters.programId !== '') count++;
    return count;
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Filtros Avanzados">
      <div className="p-4 space-y-4">
        <Form>
          <FormGroup className="mb-3">
            <Label className="text-sm fw-semibold text-gray-600">Rol del Usuario</Label>
            <Input
              type="select"
              value={filters.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="bg-gray-50 border-gray-200"
            >
              <option value="all">Cualquier Rol</option>
              <option value="student">Estudiante</option>
              <option value="teacher">Profesor</option>
              <option value="admin">Administrador</option>
            </Input>
          </FormGroup>

          <FormGroup className="mb-3">
            <Label className="text-sm fw-semibold text-gray-600">Programa Académico</Label>
            <Input
              type="select"
              value={filters.programId}
              onChange={(e) => handleChange('programId', e.target.value)}
              className="bg-gray-50 border-gray-200"
            >
              <option value="">Cualquier Programa</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Input>
          </FormGroup>

          <FormGroup className="mb-3">
            <Label className="text-sm fw-semibold text-gray-600">Tipo de Ingreso</Label>
            <Input
              type="select"
              value={filters.enrollmentType}
              onChange={(e) => handleChange('enrollmentType', e.target.value)}
              className="bg-gray-50 border-gray-200"
            >
              <option value="all">Todos</option>
              <option value="Nuevo Ingreso">Nuevo Ingreso</option>
              <option value="Reingreso">Reingreso</option>
              <option value="Oyente">Oyente</option>
            </Input>
          </FormGroup>

          <FormGroup className="mb-3">
            <Label className="text-sm fw-semibold text-gray-600">Estado de la Cuenta</Label>
            <Input
              type="select"
              value={filters.isActive}
              onChange={(e) => handleChange('isActive', e.target.value)}
              className="bg-gray-50 border-gray-200"
            >
              <option value="all">Ambos (Activos/Inactivos)</option>
              <option value="true">Solo Activos</option>
              <option value="false">Solo Inactivos</option>
            </Input>
          </FormGroup>

          <hr className="my-4 border-gray-100" />

          <h6 className="text-xs text-gray-400 font-bold uppercase mb-3">Historial e Inscripciones</h6>

          <FormGroup className="mb-3">
            <Label className="text-sm fw-semibold text-gray-600">Historial Académico</Label>
            <Input
              type="select"
              value={filters.historyStatus}
              onChange={(e) => handleChange('historyStatus', e.target.value)}
              className="bg-gray-50 border-gray-200"
            >
              <option value="all">Cualquiera</option>
              <option value="no-history">Sin Historial (Nunca ha tomado clases)</option>
              <option value="has-history">Con Historial (Ha tomado o está tomando clases)</option>
            </Input>
          </FormGroup>

          <FormGroup className="mb-3">
            <Label className="text-sm fw-semibold text-gray-600">Clases Activas</Label>
            <Input
              type="select"
              value={filters.activeEnrollments}
              onChange={(e) => handleChange('activeEnrollments', e.target.value)}
              className="bg-gray-50 border-gray-200"
            >
              <option value="all">Cualquier cantidad</option>
              <option value="zero">0 Inscripciones Activas</option>
              <option value="one-or-more">1 o más Inscritas</option>
            </Input>
          </FormGroup>

        </Form>
      </div>

      <div className="p-4 border-t border-gray-100 flex gap-3 pb-8 md:pb-4">
        {getActiveFilterCount() > 0 && (
          <Button color="light" className="flex-1 font-semibold" onClick={clearFilters}>
            Limpiar Filtros
          </Button>
        )}
        <Button color="primary" className="flex-1 font-semibold" onClick={onClose}>
          Mostrar Resultados
        </Button>
      </div>
    </Dialog>
  );
};

export default UserFiltersModal;
