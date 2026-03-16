import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Collapse,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Progress,
  Row,
  Table,
} from 'reactstrap';
import { IClassroomRun } from '../../models';
import {
  buildPaymentsSnapshotSummary,
  formatCurrency,
  getPaymentMethodLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
  getStudentItemStatus,
  getStudentStatusCounts,
  getStudentTotalPaid,
  getTotalDuePerStudent,
  groupPaymentsByStudent,
} from '../../utils/paymentSnapshotUtils';

interface ClassroomRunDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  run: IClassroomRun | null;
}

const getGradeColor = (grade: number): string => {
  if (grade >= 90) return 'success';
  if (grade >= 80) return 'info';
  if (grade >= 70) return 'warning';
  return 'danger';
};

const getSafePercent = (value: number, total: number): number => {
  if (!total || total <= 0) return 0;
  return (value / total) * 100;
};

const ClassroomRunDetailsModal: React.FC<ClassroomRunDetailsModalProps> = ({
  isOpen,
  onClose,
  run,
}) => {
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setExpandedStudentId(null);
    }
  }, [isOpen, run?.id]);

  const totalStudents = run?.totalStudents || run?.students.length || 0;
  const paymentSummary = useMemo(() => {
    if (!run?.paymentsSnapshot) return null;
    return buildPaymentsSnapshotSummary(
      run.paymentsSnapshot,
      run.students.map(student => student.studentId)
    );
  }, [run]);

  const paymentCostItems = useMemo(
    () => run?.paymentsSnapshot?.costs || [],
    [run?.paymentsSnapshot?.costs]
  );
  const paymentStatuses = run?.paymentsSnapshot?.statuses || [];
  const totalDuePerStudent = useMemo(
    () => getTotalDuePerStudent(paymentCostItems),
    [paymentCostItems]
  );
  const paymentsByStudent = useMemo(() => {
    if (!run?.paymentsSnapshot) return {};
    return groupPaymentsByStudent(run.paymentsSnapshot.payments);
  }, [run]);

  const toggleStudent = (studentId: string) => {
    setExpandedStudentId(current => (current === studentId ? null : studentId));
  };

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="xl">
      <ModalHeader toggle={onClose}>
        <i className="bi bi-file-earmark-text me-2"></i>
        Detalles Completos - Ejecución {run && `#${run.runNumber}`}
      </ModalHeader>
      <ModalBody>
        {run && (
          <>
            <Row className="mb-4">
              <Col md={8}>
                <h4>{run.classroomSubject}</h4>
                <p className="text-muted mb-2">
                  {run.classroomName} - {run.programName}
                </p>
                <div className="d-flex gap-2 flex-wrap">
                  <Badge color="secondary">Ejecución #{run.runNumber}</Badge>
                  <Badge color="info">
                    <i className="bi bi-people me-1"></i>
                    {run.totalStudents} Estudiantes
                  </Badge>
                  <Badge color="secondary">
                    <i className="bi bi-person-badge me-1"></i>
                    {run.teacherName}
                  </Badge>
                  {run.room && (
                    <Badge color="secondary">
                      <i className="bi bi-door-open me-1"></i>
                      {run.room}
                    </Badge>
                  )}
                  {run.schedule && (
                    <Badge color="secondary">
                      <i className="bi bi-clock me-1"></i>
                      {run.schedule.dayOfWeek} {run.schedule.time}
                    </Badge>
                  )}
                </div>
              </Col>
              <Col md={4} className="text-md-end">
                <small className="text-muted d-block">Período</small>
                <strong>{new Date(run.startDate).toLocaleDateString('es-ES')}</strong>
                {' - '}
                <strong>{new Date(run.endDate).toLocaleDateString('es-ES')}</strong>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={2}>
                <Card className="text-center">
                  <CardBody>
                    <h4>
                      <Badge color={getGradeColor(run.statistics.averageGrade)}>
                        {run.statistics.averageGrade.toFixed(1)}%
                      </Badge>
                    </h4>
                    <small className="text-muted">Promedio</small>
                  </CardBody>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="text-center">
                  <CardBody>
                    <h4 className="text-success">{run.statistics.passRate.toFixed(0)}%</h4>
                    <small className="text-muted">Aprobación</small>
                  </CardBody>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="text-center">
                  <CardBody>
                    <h4 className="text-info">{run.statistics.attendanceRate.toFixed(0)}%</h4>
                    <small className="text-muted">Asistencia</small>
                  </CardBody>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="text-center">
                  <CardBody>
                    <h4 className="text-success">{run.statistics.highestGrade.toFixed(1)}%</h4>
                    <small className="text-muted">Más Alta</small>
                  </CardBody>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="text-center">
                  <CardBody>
                    <h4 className="text-danger">{run.statistics.lowestGrade.toFixed(1)}%</h4>
                    <small className="text-muted">Más Baja</small>
                  </CardBody>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="text-center">
                  <CardBody>
                    <h4>
                      {run.completedModules}/{run.totalModules}
                    </h4>
                    <small className="text-muted">Módulos</small>
                  </CardBody>
                </Card>
              </Col>
            </Row>

            <Card className="mb-3">
              <CardHeader>
                <h6 className="mb-0">Distribución de Calificaciones</h6>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md={3}>
                    <div className="text-center">
                      <h5>
                        <Badge color="success">{run.statistics.distribution.excellent}</Badge>
                      </h5>
                      <Progress
                        value={getSafePercent(run.statistics.distribution.excellent, totalStudents)}
                        color="success"
                      />
                      <small>Excelente (90-100)</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h5>
                        <Badge color="info">{run.statistics.distribution.good}</Badge>
                      </h5>
                      <Progress
                        value={getSafePercent(run.statistics.distribution.good, totalStudents)}
                        color="info"
                      />
                      <small>Bueno (80-89)</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h5>
                        <Badge color="warning">{run.statistics.distribution.regular}</Badge>
                      </h5>
                      <Progress
                        value={getSafePercent(run.statistics.distribution.regular, totalStudents)}
                        color="warning"
                      />
                      <small>Regular (70-79)</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h5>
                        <Badge color="danger">{run.statistics.distribution.poor}</Badge>
                      </h5>
                      <Progress
                        value={getSafePercent(run.statistics.distribution.poor, totalStudents)}
                        color="danger"
                      />
                      <small>Deficiente (&lt;70)</small>
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>

            <Card className="mb-3">
              <CardHeader>
                <h6 className="mb-0">Pagos de la Ejecución</h6>
              </CardHeader>
              <CardBody>
                {!run.paymentsSnapshot ? (
                  <Alert color="info" className="mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    Esta ejecución no tiene un snapshot de pagos registrado.
                  </Alert>
                ) : paymentCostItems.length === 0 ? (
                  <Alert color="warning" className="mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    No se registraron costos en esta ejecución.
                  </Alert>
                ) : (
                  <>
                    {paymentSummary && (
                      <Row className="mb-3">
                        <Col md={3}>
                          <Card className="text-center bg-light">
                            <CardBody>
                              <h5 className="mb-0 text-primary">
                                {formatCurrency(paymentSummary.totalDuePerStudent)}
                              </h5>
                              <small className="text-muted">Adeudado por Estudiante</small>
                            </CardBody>
                          </Card>
                        </Col>
                        <Col md={3}>
                          <Card className="text-center bg-light">
                            <CardBody>
                              <h5 className="mb-0 text-primary">
                                {formatCurrency(paymentSummary.totalDue)}
                              </h5>
                              <small className="text-muted">Adeudado Total</small>
                            </CardBody>
                          </Card>
                        </Col>
                        <Col md={3}>
                          <Card className="text-center bg-light">
                            <CardBody>
                              <h5 className="mb-0 text-success">
                                {formatCurrency(paymentSummary.totalPaid)}
                              </h5>
                              <small className="text-muted">Pagado Total</small>
                            </CardBody>
                          </Card>
                        </Col>
                        <Col md={3}>
                          <Card className="text-center bg-light">
                            <CardBody>
                              <h5 className="mb-0 text-danger">
                                {formatCurrency(paymentSummary.balance)}
                              </h5>
                              <small className="text-muted">Saldo Total</small>
                            </CardBody>
                          </Card>
                        </Col>
                      </Row>
                    )}

                    <Row className="mb-3">
                      <Col md={7}>
                        <Card className="bg-light">
                          <CardBody>
                            <h6 className="mb-2">Costos Registrados</h6>
                            <Table responsive size="sm" className="mb-0">
                              <thead>
                                <tr>
                                  <th>Concepto</th>
                                  <th>Tipo</th>
                                  <th className="text-end">Monto</th>
                                  <th className="text-center">Requerido</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paymentCostItems.map(item => (
                                  <tr key={item.id}>
                                    <td>
                                      <strong>{item.title}</strong>
                                      {item.description && (
                                        <div className="text-muted small">{item.description}</div>
                                      )}
                                    </td>
                                    <td>
                                      <Badge color="secondary">{item.type}</Badge>
                                    </td>
                                    <td className="text-end">{formatCurrency(item.amount)}</td>
                                    <td className="text-center">
                                      <Badge color={item.required ? 'success' : 'secondary'}>
                                        {item.required ? 'Sí' : 'No'}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </CardBody>
                        </Card>
                      </Col>
                      <Col md={5}>
                        <Card className="bg-light">
                          <CardBody>
                            <h6 className="mb-2">Estado Global por Ítems</h6>
                            {paymentSummary && (
                              <div className="d-flex flex-wrap gap-2">
                                <Badge color="success">Pagados: {paymentSummary.statusCounts.paid}</Badge>
                                <Badge color="warning">Pendientes: {paymentSummary.statusCounts.pending}</Badge>
                                <Badge color="danger">No pagados: {paymentSummary.statusCounts.unpaid}</Badge>
                              </div>
                            )}
                          </CardBody>
                        </Card>
                      </Col>
                    </Row>

                    <Card>
                      <CardHeader>
                        <h6 className="mb-0">Pagos por Estudiante</h6>
                      </CardHeader>
                      <CardBody>
                        <Table responsive hover size="sm">
                          <thead className="sticky-top bg-white">
                            <tr>
                              <th>#</th>
                              <th>Estudiante</th>
                              <th className="text-end">Adeudado</th>
                              <th className="text-end">Pagado</th>
                              <th className="text-end">Saldo</th>
                              <th>Estados</th>
                              <th className="text-center">Detalle</th>
                            </tr>
                          </thead>
                          <tbody>
                            {run.students.map((student, index) => {
                              const totalDue = totalDuePerStudent;
                              const totalPaid = getStudentTotalPaid(
                                run.paymentsSnapshot?.payments || [],
                                student.studentId
                              );
                              const balance = totalDue - totalPaid;
                              const statusCounts = getStudentStatusCounts(
                                paymentCostItems,
                                paymentStatuses,
                                student.studentId
                              );
                              const payments = paymentsByStudent[student.studentId] || [];

                              return (
                                <React.Fragment key={student.studentId}>
                                  <tr>
                                    <td>{index + 1}</td>
                                    <td>
                                      <strong>{student.studentName}</strong>
                                      {student.studentEmail && (
                                        <div className="text-muted small">{student.studentEmail}</div>
                                      )}
                                    </td>
                                    <td className="text-end">{formatCurrency(totalDue)}</td>
                                    <td className="text-end">{formatCurrency(totalPaid)}</td>
                                    <td className="text-end">{formatCurrency(balance)}</td>
                                    <td>
                                      <div className="d-flex flex-wrap gap-1">
                                        <Badge color="success">{statusCounts.paid}</Badge>
                                        <Badge color="warning">{statusCounts.pending}</Badge>
                                        <Badge color="danger">{statusCounts.unpaid}</Badge>
                                      </div>
                                    </td>
                                    <td className="text-center">
                                      <Button
                                        color="primary"
                                        size="sm"
                                        onClick={() => toggleStudent(student.studentId)}
                                      >
                                        <i className="bi bi-chevron-down"></i>
                                      </Button>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colSpan={7} className="p-0">
                                      <Collapse isOpen={expandedStudentId === student.studentId}>
                                        <div className="p-3 bg-light">
                                          <Row>
                                            <Col md={6}>
                                              <h6 className="mb-2">Estado por Costo</h6>
                                              <Table responsive size="sm" className="mb-0">
                                                <thead>
                                                  <tr>
                                                    <th>Concepto</th>
                                                    <th className="text-end">Monto</th>
                                                    <th className="text-center">Estado</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {paymentCostItems.map(item => {
                                                    const status = getStudentItemStatus(
                                                      paymentStatuses,
                                                      student.studentId,
                                                      item.id
                                                    );

                                                    return (
                                                      <tr key={item.id}>
                                                        <td>{item.title}</td>
                                                        <td className="text-end">
                                                          {formatCurrency(item.amount)}
                                                        </td>
                                                        <td className="text-center">
                                                          <Badge color={getPaymentStatusColor(status)}>
                                                            {getPaymentStatusLabel(status)}
                                                          </Badge>
                                                        </td>
                                                      </tr>
                                                    );
                                                  })}
                                                </tbody>
                                              </Table>
                                            </Col>
                                            <Col md={6}>
                                              <h6 className="mb-2">Pagos Registrados</h6>
                                              {payments.length === 0 ? (
                                                <Alert color="info" className="mb-0">
                                                  No hay pagos registrados para este estudiante.
                                                </Alert>
                                              ) : (
                                                <div>
                                                  {payments.map(payment => {
                                                    const appliedLabels = payment.appliedItemIds
                                                      .map(itemId =>
                                                        paymentCostItems.find(item => item.id === itemId)?.title ||
                                                        'Costo eliminado'
                                                      )
                                                      .join(', ');
                                                    return (
                                                      <div
                                                        key={`detail-${payment.id}`}
                                                        className="border rounded p-2 mb-2"
                                                      >
                                                        <div className="d-flex justify-content-between">
                                                          <strong>
                                                            {formatCurrency(payment.amount)}
                                                          </strong>
                                                          <small className="text-muted">
                                                            {new Date(payment.createdAt).toLocaleDateString('es-ES')}
                                                          </small>
                                                        </div>
                                                        <div className="text-muted small">
                                                          Método: {getPaymentMethodLabel(payment.method)}
                                                        </div>
                                                        <div className="text-muted small">
                                                          Aplicado a: {appliedLabels || 'Sin asignar'}
                                                        </div>
                                                        {payment.comment && (
                                                          <div className="text-muted small">
                                                            Nota: {payment.comment}
                                                          </div>
                                                        )}
                                                        {payment.receiptUrl && (
                                                          <div className="mt-1">
                                                            <a
                                                              href={payment.receiptUrl}
                                                              target="_blank"
                                                              rel="noreferrer"
                                                            >
                                                              <i className="bi bi-receipt me-1"></i>
                                                              {payment.receiptName || 'Ver recibo'}
                                                            </a>
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              )}
                                            </Col>
                                          </Row>
                                        </div>
                                      </Collapse>
                                    </td>
                                  </tr>
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </Table>
                      </CardBody>
                    </Card>
                  </>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h6 className="mb-0">Lista de Estudiantes ({run.totalStudents})</h6>
              </CardHeader>
              <CardBody>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Table responsive hover size="sm">
                    <thead className="sticky-top bg-white">
                      <tr>
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Teléfono</th>
                        <th className="text-center">Calificación</th>
                        <th className="text-center">Asistencia</th>
                        <th className="text-center">Participación</th>
                        <th className="text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {run.students
                        .slice()
                        .sort((a, b) => (b.finalGrade || 0) - (a.finalGrade || 0))
                        .map((student, index) => (
                          <tr key={student.studentId}>
                            <td>{index + 1}</td>
                            <td>
                              <strong>{student.studentName}</strong>
                              {student.studentEmail && (
                                <>
                                  <br />
                                  <small className="text-muted">{student.studentEmail}</small>
                                </>
                              )}
                            </td>
                            <td>{student.studentPhone}</td>
                            <td className="text-center">
                              {student.finalGrade !== undefined ? (
                                <Badge color={getGradeColor(student.finalGrade)}>
                                  {student.finalGrade.toFixed(1)}%
                                </Badge>
                              ) : (
                                <span className="text-muted">N/A</span>
                              )}
                            </td>
                            <td className="text-center">
                              <Badge color={student.attendanceRate >= 80 ? 'success' : 'warning'}>
                                {student.attendanceRate.toFixed(0)}%
                              </Badge>
                            </td>
                            <td className="text-center">
                              <Badge color="info">{student.participationPoints} pts</Badge>
                            </td>
                            <td className="text-center">
                              <Badge color={student.status === 'completed' ? 'success' : 'danger'}>
                                {student.status === 'completed' ? 'Aprobado' : 'Reprobado'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>

            {run.notes && (
              <Alert color="info" className="mt-3">
                <i className="bi bi-sticky me-2"></i>
                <strong>Notas:</strong> {run.notes}
              </Alert>
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

export default ClassroomRunDetailsModal;
