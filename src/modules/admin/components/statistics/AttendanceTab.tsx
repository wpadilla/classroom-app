import React from 'react';
import { Row, Col, Card, CardBody, Table, Badge } from 'reactstrap';
import Chart from 'react-apexcharts';
import { IAttendanceAnalytics } from '../../../../models';

interface Props {
  data: IAttendanceAnalytics;
}

const AttendanceTab: React.FC<Props> = ({ data }) => {
  const classroomLabels = data.attendanceByClassroom.map((c) => c.classroomName).slice(0, 12);
  const classroomValues = data.attendanceByClassroom.map((c) => Number(c.attendanceRate.toFixed(1))).slice(0, 12);

  return (
    <>
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100 bg-primary text-white">
            <CardBody className="text-center py-4">
              <h2>{data.overallAttendanceRate.toFixed(1)}%</h2>
              <p className="mb-0">Asistencia General</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="text-center py-4">
              <h2 className="text-success">{data.attendanceByClassroom.length}</h2>
              <p className="text-muted mb-0">Clases Activas</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="text-center py-4">
              <h2 className="text-danger">{data.lowAttendanceAlerts.length}</h2>
              <p className="text-muted mb-0">Alertas de Baja Asistencia</p>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={12} className="mb-4">
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h6 className="mb-3">Asistencia por Clase</h6>
              {classroomLabels.length > 0 ? (
                <Chart
                  type="bar"
                  height={350}
                  options={{
                    chart: { toolbar: { show: false } },
                    xaxis: { categories: classroomLabels, labels: { rotate: -45 } },
                    colors: ['#22c55e'],
                    plotOptions: { bar: { borderRadius: 4 } },
                    yaxis: { max: 100, labels: { formatter: (v: number) => `${v}%` } },
                  }}
                  series={[{ name: 'Asistencia', data: classroomValues }]}
                />
              ) : (
                <p className="text-muted text-center">Sin datos</p>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {data.lowAttendanceAlerts.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardBody>
            <h6 className="mb-3">
              <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
              Estudiantes con Baja Asistencia (&lt;60%)
            </h6>
            <Table hover responsive size="sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Estudiante</th>
                  <th>Clase</th>
                  <th className="text-center">Asistencia</th>
                  <th className="text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.lowAttendanceAlerts.map((alert, i) => (
                  <tr key={`${alert.studentId}-${i}`}>
                    <td>{i + 1}</td>
                    <td>{alert.studentName}</td>
                    <td>{alert.classroomName}</td>
                    <td className="text-center">{alert.attendanceRate.toFixed(1)}%</td>
                    <td className="text-center">
                      <Badge color={alert.attendanceRate < 30 ? 'danger' : 'warning'}>
                        {alert.attendanceRate < 30 ? 'Critico' : 'Bajo'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      )}
    </>
  );
};

export default AttendanceTab;
