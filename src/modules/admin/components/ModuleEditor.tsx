// ModuleEditor Component - Edits a single IModule with collapsible UI
// Mobile-first design with touch-friendly inputs

import React from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Collapse,
  Row,
  Col,
  FormGroup,
  Label,
  Input,
  Button,
  Badge
} from 'reactstrap';
import { IModule } from '../../../models';
import {
  formatDateForInput,
  parseStringArray,
  joinStringArray
} from '../../../utils/moduleUtils';

interface ModuleEditorProps {
  module: IModule;
  onChange: (updated: IModule) => void;
  onDelete: () => void;
  expanded: boolean;
  onToggle: () => void;
  canDelete: boolean;
}

const ModuleEditor: React.FC<ModuleEditorProps> = ({
  module,
  onChange,
  onDelete,
  expanded,
  onToggle,
  canDelete
}) => {
  // Update single field
  const updateField = <K extends keyof IModule>(field: K, value: IModule[K]) => {
    onChange({ ...module, [field]: value });
  };

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateField('date', value ? new Date(value) : new Date());
  };

  // Handle topics/materials as comma-separated
  const handleTopicsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('topics', parseStringArray(e.target.value));
  };

  const handleMaterialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('materials', parseStringArray(e.target.value));
  };

  return (
    <Card className="mb-2 border shadow-sm">
      <CardHeader
        className="d-flex justify-content-between align-items-center py-2 px-3"
        style={{ cursor: 'pointer', backgroundColor: expanded ? '#f8f9fa' : 'white' }}
        onClick={onToggle}
      >
        <div className="d-flex align-items-center flex-grow-1">
          <i className={`bi ${expanded ? 'bi-chevron-down' : 'bi-chevron-right'} me-2`}></i>
          <div>
            <span className="fw-semibold">{module.name || `Módulo ${module.weekNumber}`}</span>
            <Badge color="secondary" className="ms-2 d-none d-sm-inline">
              Semana {module.weekNumber}
            </Badge>
          </div>
        </div>
        <div className="d-flex align-items-center">
          {module.isCompleted && (
            <Badge color="success" className="me-2">
              <i className="bi bi-check-circle me-1"></i>
              Completado
            </Badge>
          )}
          {canDelete && (
            <Button
              color="danger"
              size="sm"
              outline
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Eliminar módulo"
            >
              <i className="bi bi-trash"></i>
            </Button>
          )}
        </div>
      </CardHeader>

      <Collapse isOpen={expanded}>
        <CardBody className="pt-3 pb-2">
          <Row>
            {/* Module Name */}
            <Col xs="12" md="6" className="mb-3">
              <FormGroup className="mb-0">
                <Label className="small text-muted mb-1">Nombre del módulo</Label>
                <Input
                  type="text"
                  value={module.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Ej: Introducción al tema"
                  bsSize="sm"
                />
              </FormGroup>
            </Col>

            {/* Week Number */}
            <Col xs="6" md="3" className="mb-3">
              <FormGroup className="mb-0">
                <Label className="small text-muted mb-1">Semana #</Label>
                <Input
                  type="number"
                  min="1"
                  value={module.weekNumber}
                  onChange={(e) => updateField('weekNumber', parseInt(e.target.value) || 1)}
                  bsSize="sm"
                />
              </FormGroup>
            </Col>

            {/* Date */}
            <Col xs="6" md="3" className="mb-3">
              <FormGroup className="mb-0">
                <Label className="small text-muted mb-1">Fecha</Label>
                <Input
                  type="date"
                  value={formatDateForInput(module.date)}
                  onChange={handleDateChange}
                  bsSize="sm"
                />
              </FormGroup>
            </Col>

            {/* Description */}
            <Col xs="12" className="mb-3">
              <FormGroup className="mb-0">
                <Label className="small text-muted mb-1">Descripción</Label>
                <Input
                  type="textarea"
                  rows={2}
                  value={module.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Descripción del contenido del módulo..."
                  bsSize="sm"
                />
              </FormGroup>
            </Col>

            {/* Topics */}
            <Col xs="12" md="6" className="mb-3">
              <FormGroup className="mb-0">
                <Label className="small text-muted mb-1">
                  <i className="bi bi-list-check me-1"></i>
                  Temas (separados por coma)
                </Label>
                <Input
                  type="text"
                  value={joinStringArray(module.topics)}
                  onChange={handleTopicsChange}
                  placeholder="Tema 1, Tema 2, Tema 3..."
                  bsSize="sm"
                />
              </FormGroup>
            </Col>

            {/* Materials */}
            <Col xs="12" md="6" className="mb-3">
              <FormGroup className="mb-0">
                <Label className="small text-muted mb-1">
                  <i className="bi bi-book me-1"></i>
                  Materiales (separados por coma)
                </Label>
                <Input
                  type="text"
                  value={joinStringArray(module.materials)}
                  onChange={handleMaterialsChange}
                  placeholder="Libro Cap. 1, Guía PDF..."
                  bsSize="sm"
                />
              </FormGroup>
            </Col>

            {/* Video URL */}
            <Col xs="12" md="8" className="mb-3">
              <FormGroup className="mb-0">
                <Label className="small text-muted mb-1">
                  <i className="bi bi-youtube me-1"></i>
                  URL del Video (opcional)
                </Label>
                <Input
                  type="url"
                  value={module.videoUrl || ''}
                  onChange={(e) => updateField('videoUrl', e.target.value)}
                  placeholder="https://youtube.com/..."
                  bsSize="sm"
                />
              </FormGroup>
            </Col>

            {/* Completed Toggle */}
            <Col xs="12" md="4" className="mb-3">
              <FormGroup check className="mt-md-4">
                <Input
                  type="checkbox"
                  id={`completed-${module.id}`}
                  checked={module.isCompleted}
                  onChange={(e) => updateField('isCompleted', e.target.checked)}
                />
                <Label check for={`completed-${module.id}`} className="small">
                  <i className="bi bi-check-circle me-1"></i>
                  Módulo completado
                </Label>
              </FormGroup>
            </Col>
          </Row>
        </CardBody>
      </Collapse>
    </Card>
  );
};

export default ModuleEditor;
