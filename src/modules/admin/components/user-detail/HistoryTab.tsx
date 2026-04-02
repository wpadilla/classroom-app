import React from 'react';
import { Alert, Badge, Button, Card, CardBody, Col, FormGroup, Input, Label, Row, Spinner, Table } from 'reactstrap';
import { IClassroom, IClassroomHistory, IProgram, IUser } from '../../../../models';

interface HistoryTabProps {
  currentUser: IUser;
  classrooms: IClassroom[];
  programs: IProgram[];
  historyForm: {
    classroomId: string;
    enrollmentDate: string;
    completionDate: string;
    finalGrade: number;
    status: 'completed' | 'dropped' | 'failed';
  };
  setHistoryForm: React.Dispatch<React.SetStateAction<any>>;
  editingHistory: IClassroomHistory | null;
  addingHistory: boolean;
  saving: boolean;
  startAddHistory: () => void;
  startEditHistory: (entry: IClassroomHistory) => void;
  cancelHistoryEdit: () => void;
  saveHistoryEntry: () => void;
  deleteHistoryEntry: (classroomId: string) => void;
  getGradeColor: (grade: number) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

const HistoryTab: React.FC<HistoryTabProps> = ({
  currentUser,
  classrooms,
  programs,
  historyForm,
  setHistoryForm,
  editingHistory,
  addingHistory,
  saving,
  startAddHistory,
  startEditHistory,
  cancelHistoryEdit,
  saveHistoryEntry,
  deleteHistoryEntry,
  getGradeColor,
  getStatusBadge,
}) => {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Historial de Clases Completadas</h6>
        <Button color="success" size="sm" onClick={startAddHistory} disabled={addingHistory}>
          <i className="bi bi-plus me-1"></i>
          Agregar Clase
        </Button>
      </div>

      {(addingHistory || editingHistory) && (
        <Card className="mb-3 bg-light">
          <CardBody>
            <h6>{editingHistory ? 'Editar Clase' : 'Agregar Clase al Historial'}</h6>
            <Row>
              <Col md={4}>
                <FormGroup>
                  <Label>Clase</Label>
                  <Input
                    type="select"
                    value={historyForm.classroomId}
                    onChange={e => setHistoryForm((prev: any) => ({ ...prev, classroomId: e.target.value }))}
                    disabled={!!editingHistory}
                  >
                    <option value="">Seleccionar...</option>
                    {programs.map(program => {
                      const historyClassroomIds = new Set(
                        (currentUser.completedClassrooms || []).map(h => h.classroomId)
                      );
                      const availableClassrooms = classrooms
                        .filter(c => c.programId === program.id)
                        .filter(c => editingHistory || !historyClassroomIds.has(c.id));

                      if (availableClassrooms.length === 0) return null;

                      return (
                        <optgroup key={program.id} label={program.name}>
                          {availableClassrooms.map(c => (
                            <option key={c.id} value={c.id}>{c.subject}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </Input>
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label>Fecha Inscripcion</Label>
                  <Input
                    type="date"
                    value={historyForm.enrollmentDate}
                    onChange={e => setHistoryForm((prev: any) => ({ ...prev, enrollmentDate: e.target.value }))}
                  />
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label>Fecha Finalizacion</Label>
                  <Input
                    type="date"
                    value={historyForm.completionDate}
                    onChange={e => setHistoryForm((prev: any) => ({ ...prev, completionDate: e.target.value }))}
                  />
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label>Calificacion</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={historyForm.finalGrade}
                    onChange={e => setHistoryForm((prev: any) => ({ ...prev, finalGrade: Number(e.target.value) }))}
                  />
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label>Estado</Label>
                  <Input
                    type="select"
                    value={historyForm.status}
                    onChange={e => setHistoryForm((prev: any) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="completed">Completado</option>
                    <option value="dropped">Retirado</option>
                    <option value="failed">Reprobado</option>
                  </Input>
                </FormGroup>
              </Col>
            </Row>
            <div className="d-flex gap-2">
              <Button color="success" size="sm" onClick={saveHistoryEntry} disabled={saving || !historyForm.classroomId}>
                {saving ? <Spinner size="sm" /> : <i className="bi bi-check me-1"></i>}
                Guardar
              </Button>
              <Button color="secondary" size="sm" onClick={cancelHistoryEdit}>
                Cancelar
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {(currentUser.completedClassrooms?.length || 0) > 0 ? (
        <Table size="sm" bordered striped hover>
          <thead>
            <tr>
              <th>Clase</th>
              <th>Programa</th>
              <th>Inscripcion</th>
              <th>Finalizacion</th>
              <th>Calificacion</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentUser.completedClassrooms?.map((entry, idx) => (
              <tr key={idx}>
                <td>{entry.classroomName}</td>
                <td><small className="text-muted">{entry.programName}</small></td>
                <td>{new Date(entry.enrollmentDate).toLocaleDateString()}</td>
                <td>{new Date(entry.completionDate).toLocaleDateString()}</td>
                <td>
                  {entry.finalGrade !== undefined && (
                    <Badge color={getGradeColor(entry.finalGrade)}>
                      {entry.finalGrade}%
                    </Badge>
                  )}
                </td>
                <td>{getStatusBadge(entry.status)}</td>
                <td>
                  <Button
                    color="link"
                    size="sm"
                    className="p-0 me-2"
                    onClick={() => startEditHistory(entry)}
                  >
                    <i className="bi bi-pencil text-primary"></i>
                  </Button>
                  <Button
                    color="link"
                    size="sm"
                    className="p-0"
                    onClick={() => deleteHistoryEntry(entry.classroomId)}
                  >
                    <i className="bi bi-trash text-danger"></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Alert color="info">No hay clases en el historial</Alert>
      )}
    </div>
  );
};

export default HistoryTab;
