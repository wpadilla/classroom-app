import React from 'react';
import { Alert, Badge, Card, CardBody, Col, Progress, Row, Spinner, Table } from 'reactstrap';
import { ProgramProgress } from '../../../../hooks/useProgramProgress';

interface ProgressTabProps {
  loading: boolean;
  programProgress: ProgramProgress[];
  getGradeColor: (grade: number) => string;
}

const ProgressTab: React.FC<ProgressTabProps> = ({ loading, programProgress, getGradeColor }) => {
  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner color="primary" />
        <p className="mt-2">Calculando progreso...</p>
      </div>
    );
  }

  if (programProgress.length === 0) {
    return <Alert color="info">No hay progreso en programas registrado</Alert>;
  }

  return (
    <Row>
      {programProgress.map((prog) => (
        <Col md={6} key={prog.program.id} className="mb-3">
          <Card>
            <CardBody>
              <h6 className="mb-3">
                <i className="bi bi-journal-bookmark me-2"></i>
                {prog.program.name}
              </h6>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Progreso: {prog.completedClassrooms}/{prog.totalClassrooms} clases</small>
                  <small className="fw-bold">{prog.progressPercentage}%</small>
                </div>
                <Progress
                  value={prog.progressPercentage}
                  color={prog.progressPercentage === 100 ? 'success' : 'primary'}
                />
              </div>

              {prog.averageGrade > 0 && (
                <div className="mb-3">
                  <Badge color={getGradeColor(prog.averageGrade)} className="me-2">
                    Promedio: {prog.averageGrade}%
                  </Badge>
                  {prog.enrolledClassrooms > 0 && (
                    <Badge color="info">
                      {prog.enrolledClassrooms} en curso
                    </Badge>
                  )}
                </div>
              )}

              <details>
                <summary className="text-muted small mb-2" style={{ cursor: 'pointer' }}>
                  Ver detalle de clases
                </summary>
                <Table size="sm" borderless className="mb-0">
                  <tbody>
                    {prog.classroomDetails.map((detail, idx) => (
                      <tr key={idx}>
                        <td className="ps-0">
                          {detail.status === 'completed' && <i className="bi bi-check-circle text-success me-1"></i>}
                          {detail.status === 'enrolled' && <i className="bi bi-play-circle text-primary me-1"></i>}
                          {detail.status === 'not-started' && <i className="bi bi-circle text-muted me-1"></i>}
                          <small>{detail.classroom.name}</small>
                        </td>
                        <td className="text-end pe-0">
                          {detail.finalGrade !== undefined && (
                            <Badge color={getGradeColor(detail.finalGrade)} size="sm">
                              {detail.finalGrade}%
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </details>
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default ProgressTab;
