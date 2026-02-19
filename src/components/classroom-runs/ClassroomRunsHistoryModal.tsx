import React from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Table,
} from 'reactstrap';
import { IClassroom, IClassroomRun } from '../../models';
import {
  buildPaymentsSnapshotSummary,
  formatCurrency,
} from '../../utils/paymentSnapshotUtils';

interface ClassroomRunsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: IClassroom | null;
  runs: IClassroomRun[];
  onViewRun: (run: IClassroomRun) => void;
}

const getGradeColor = (grade: number): string => {
  if (grade >= 90) return 'success';
  if (grade >= 80) return 'info';
  if (grade >= 70) return 'warning';
  return 'danger';
};

const ClassroomRunsHistoryModal: React.FC<ClassroomRunsHistoryModalProps> = ({
  isOpen,
  onClose,
  classroom,
  runs,
  onViewRun,
}) => {
  const runsWithPayments = runs.filter(run => run.paymentsSnapshot);
  const paymentTotals = runsWithPayments.reduce(
    (acc, run) => {
      if (!run.paymentsSnapshot) return acc;
      const studentIds = run.students.map(student => student.studentId);
      const summary = buildPaymentsSnapshotSummary(run.paymentsSnapshot, studentIds);
      acc.totalDue += summary.totalDue;
      acc.totalPaid += summary.totalPaid;
      acc.statusCounts.paid += summary.statusCounts.paid;
      acc.statusCounts.pending += summary.statusCounts.pending;
      acc.statusCounts.unpaid += summary.statusCounts.unpaid;
      return acc;
    },
    {
      totalDue: 0,
      totalPaid: 0,
      statusCounts: { paid: 0, pending: 0, unpaid: 0 },
    }
  );
  const totalBalance = paymentTotals.totalDue - paymentTotals.totalPaid;

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="xl">
      <ModalHeader toggle={onClose}>
        <i className="bi bi-archive me-2"></i>
        Historial de Ejecuciones - {classroom?.subject}
      </ModalHeader>
      <ModalBody>
        {classroom && (
          <>
            <Alert color="info" className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{classroom.name}</strong>
                  <br />
                  <small>
                    Cada ejecución representa un grupo de estudiantes que completó esta clase
                  </small>
                </div>
                <Badge color="primary">{runs.length} Ejecuciones Totales</Badge>
              </div>
            </Alert>

            {runs.length === 0 ? (
              <Alert color="warning">
                <i className="bi bi-info-circle me-2"></i>
                Esta clase aún no tiene ejecuciones finalizadas
              </Alert>
            ) : (
              <>
                <Row className="mb-3">
                  <Col md={3}>
                    <Card className="text-center bg-light">
                      <CardBody>
                        <h4 className="mb-0">{runs.length}</h4>
                        <small className="text-muted">Ejecuciones</small>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center bg-light">
                      <CardBody>
                        <h4 className="mb-0">
                          {runs.reduce((sum, run) => sum + run.totalStudents, 0)}
                        </h4>
                        <small className="text-muted">Total Estudiantes</small>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center bg-light">
                      <CardBody>
                        <h4 className="mb-0">
                          {(
                            runs.reduce((sum, run) => sum + run.statistics.averageGrade, 0) /
                            runs.length
                          ).toFixed(1)}%
                        </h4>
                        <small className="text-muted">Promedio Histórico</small>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center bg-light">
                      <CardBody>
                        <h4 className="mb-0">
                          {(
                            runs.reduce((sum, run) => sum + run.statistics.passRate, 0) /
                            runs.length
                          ).toFixed(0)}%
                        </h4>
                        <small className="text-muted">Tasa Aprobación</small>
                      </CardBody>
                    </Card>
                  </Col>
                </Row>

                {runsWithPayments.length > 0 && (
                  <Row className="mb-3">
                    <Col md={4}>
                      <Card className="text-center bg-light">
                        <CardBody>
                          <h5 className="mb-0 text-primary">
                            {formatCurrency(paymentTotals.totalDue)}
                          </h5>
                          <small className="text-muted">Adeudado Total</small>
                        </CardBody>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="text-center bg-light">
                        <CardBody>
                          <h5 className="mb-0 text-success">
                            {formatCurrency(paymentTotals.totalPaid)}
                          </h5>
                          <small className="text-muted">Pagado Total</small>
                        </CardBody>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="text-center bg-light">
                        <CardBody>
                          <h5 className="mb-0 text-danger">
                            {formatCurrency(totalBalance)}
                          </h5>
                          <small className="text-muted">Saldo Global</small>
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>
                )}

                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Ejecución</th>
                      <th className="text-center">Estudiantes</th>
                      <th className="text-center">Promedio</th>
                      <th className="text-center">Aprobados</th>
                      <th className="text-center">Asistencia</th>
                      <th className="text-center">Módulos</th>
                      <th>Período</th>
                      <th>Pagos</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map(run => {
                      const passedStudents =
                        run.statistics.distribution.excellent +
                        run.statistics.distribution.good +
                        run.statistics.distribution.regular;
                      const summary = run.paymentsSnapshot
                        ? buildPaymentsSnapshotSummary(
                            run.paymentsSnapshot,
                            run.students.map(student => student.studentId)
                          )
                        : null;

                      return (
                        <tr key={run.id}>
                          <td>
                            <Badge color="secondary">#{run.runNumber}</Badge>
                          </td>
                          <td className="text-center">
                            <Badge color="primary">{run.totalStudents}</Badge>
                          </td>
                          <td className="text-center">
                            <Badge color={getGradeColor(run.statistics.averageGrade)}>
                              {run.statistics.averageGrade.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Badge color="success">
                              {passedStudents}/{run.totalStudents}
                            </Badge>
                            <br />
                            <small className="text-muted">
                              {run.statistics.passRate.toFixed(0)}%
                            </small>
                          </td>
                          <td className="text-center">
                            <Badge
                              color={run.statistics.attendanceRate >= 80 ? 'success' : 'warning'}
                            >
                              {run.statistics.attendanceRate.toFixed(0)}%
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Badge
                              color={
                                run.completedModules === run.totalModules ? 'success' : 'warning'
                              }
                            >
                              {run.completedModules}/{run.totalModules}
                            </Badge>
                          </td>
                          <td>
                            <small>
                              {new Date(run.startDate).toLocaleDateString('es-ES', {
                                month: 'short',
                                day: 'numeric',
                              })}
                              {' - '}
                              {new Date(run.endDate).toLocaleDateString('es-ES', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </small>
                          </td>
                          <td>
                            {summary ? (
                              <div className="d-flex flex-column gap-1">
                                <small className="text-muted">
                                  Adeudado: <strong>{formatCurrency(summary.totalDue)}</strong>
                                </small>
                                <small className="text-muted">
                                  Pagado: <strong>{formatCurrency(summary.totalPaid)}</strong>
                                </small>
                                <small className="text-muted">
                                  Saldo: <strong>{formatCurrency(summary.balance)}</strong>
                                </small>
                              </div>
                            ) : (
                              <small className="text-muted">Sin datos</small>
                            )}
                          </td>
                          <td className="text-center">
                            <Button color="primary" size="sm" onClick={() => onViewRun(run)}>
                              <i className="bi bi-eye"></i>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </>
            )}
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ClassroomRunsHistoryModal;
