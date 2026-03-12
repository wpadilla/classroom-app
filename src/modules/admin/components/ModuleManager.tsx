// ModuleManager Component - Manages list of modules with add/remove/edit
// Mobile-first collapsible list design

import React, { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Alert,
  Collapse
} from 'reactstrap';
import { IModule } from '../../../models';
import ModuleEditor from './ModuleEditor';
import {
  createDefaultModule,
  renumberModules,
  validateModules
} from '../../../utils/moduleUtils';

interface ModuleManagerProps {
  modules: IModule[];
  onChange: (modules: IModule[]) => void;
  readOnly?: boolean;
}

const ModuleManager: React.FC<ModuleManagerProps> = ({
  modules,
  onChange,
  readOnly = false
}) => {
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(true);

  // Add new module
  const handleAddModule = () => {
    const nextWeekNumber = modules.length > 0
      ? Math.max(...modules.map(m => m.weekNumber)) + 1
      : 1;
    const newModule = createDefaultModule(nextWeekNumber);
    onChange([...modules, newModule]);
    setExpandedModuleId(newModule.id);
  };

  // Remove module
  const handleRemoveModule = (moduleId: string) => {
    if (modules.length <= 1) {
      return; // Keep at least one module
    }
    const filtered = modules.filter(m => m.id !== moduleId);
    const renumbered = renumberModules(filtered);
    onChange(renumbered);
    if (expandedModuleId === moduleId) {
      setExpandedModuleId(null);
    }
  };

  // Update module
  const handleUpdateModule = (moduleId: string, updated: IModule) => {
    const updatedModules = modules.map(m =>
      m.id === moduleId ? updated : m
    );
    onChange(updatedModules);
  };

  // Toggle module expansion
  const handleToggleModule = (moduleId: string) => {
    setExpandedModuleId(prev => prev === moduleId ? null : moduleId);
  };

  // Collapse all modules
  const handleCollapseAll = () => {
    setExpandedModuleId(null);
  };

  // Get validation status
  const validation = validateModules(modules);
  const completedCount = modules.filter(m => m.isCompleted).length;

  // Sort modules by week number for display
  const sortedModules = [...modules].sort((a, b) => a.weekNumber - b.weekNumber);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader
        className="bg-white border-bottom d-flex justify-content-between align-items-center py-2"
        style={{ cursor: 'pointer' }}
        onClick={() => setIsListExpanded(!isListExpanded)}
      >
        <div className="d-flex align-items-center">
          <i className={`bi ${isListExpanded ? 'bi-chevron-down' : 'bi-chevron-right'} me-2`}></i>
          <i className="bi bi-journal-bookmark-fill me-2 text-primary"></i>
          <span className="fw-semibold">Módulos del Curso</span>
          <Badge color="primary" pill className="ms-2">
            {modules.length}
          </Badge>
          {completedCount > 0 && (
            <Badge color="success" pill className="ms-1 d-none d-sm-inline">
              {completedCount} completados
            </Badge>
          )}
        </div>
        {!readOnly && (
          <Button
            color="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleAddModule();
            }}
            className="d-flex align-items-center"
          >
            <i className="bi bi-plus-circle me-1"></i>
            <span className="d-none d-sm-inline">Agregar</span>
          </Button>
        )}
      </CardHeader>

      <Collapse isOpen={isListExpanded}>
        <CardBody className="p-2 p-sm-3">
          {/* Validation Error */}
          {!validation.valid && (
            <Alert color="warning" className="py-2 mb-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {validation.error}
            </Alert>
          )}

          {/* Quick Actions */}
          {modules.length > 1 && (
            <div className="d-flex justify-content-end mb-2 gap-2">
              <Button
                color="link"
                size="sm"
                className="p-0 text-muted"
                onClick={handleCollapseAll}
              >
                <i className="bi bi-arrows-collapse me-1"></i>
                Colapsar todos
              </Button>
            </div>
          )}

          {/* Module List */}
          {sortedModules.length === 0 ? (
            <Alert color="info" className="text-center mb-0">
              <i className="bi bi-info-circle me-2"></i>
              No hay módulos configurados. Haz clic en "Agregar" para crear uno.
            </Alert>
          ) : (
            <div className="module-list">
              {sortedModules.map((module) => (
                <ModuleEditor
                  key={module.id}
                  module={module}
                  onChange={(updated) => handleUpdateModule(module.id, updated)}
                  onDelete={() => handleRemoveModule(module.id)}
                  expanded={expandedModuleId === module.id}
                  onToggle={() => handleToggleModule(module.id)}
                  canDelete={modules.length > 1 && !readOnly}
                />
              ))}
            </div>
          )}

          {/* Summary Footer */}
          {modules.length > 0 && (
            <div className="border-top pt-2 mt-2 d-flex justify-content-between align-items-center small text-muted">
              <span>
                <i className="bi bi-calendar-week me-1"></i>
                {modules.length} semanas programadas
              </span>
              <span>
                <i className="bi bi-check2-circle me-1"></i>
                {completedCount} de {modules.length} completados
              </span>
            </div>
          )}
        </CardBody>
      </Collapse>
    </Card>
  );
};

export default ModuleManager;
