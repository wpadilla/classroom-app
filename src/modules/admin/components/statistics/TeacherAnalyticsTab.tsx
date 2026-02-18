import React from 'react';
import { Row, Col, Card, CardBody, Table, Badge } from 'reactstrap';
import Chart from 'react-apexcharts';
import { ITeacherAnalytics } from '../../../../models';

interface Props {
  data: ITeacherAnalytics;
}

const TeacherAnalyticsTab: React.FC<Props> = ({ data }) => {
  // Radar chart: top 5 teachers comparison
  const topTeachers = [...data.teacherPerformance]
    .sort((a, b) => b.averageGrade - a.averageGrade)
    .slice(0, 5);

  const radarLabels = ['Promedio', 'Aprobacion', 'Asistencia', 'Estudiantes', 'Clases'];

  const maxStudents = Math.max(...data.teacherPerformance.map((t) => t.totalStudents), 1);
  const maxClassrooms = Math.max(...data.teacherPerformance.map((t) => t.classroomCount), 1);

  const radarSeries = topTeachers.map((t) => ({
    name: t.teacherName,
    data: [
      t.averageGrade,
      t.passRate,
      t.attendanceRate,
      (t.totalStudents / maxStudents) * 100,
      (t.classroomCount / maxClassrooms) * 100,
    ],
  }));

  // Workload bar chart
  const teacherNames = data.teacherPerformance.map((t) => t.teacherName);
  const teacherStudents = data.teacherPerformance.map((t) => t.totalStudents);
  const teacherClassrooms = data.teacherPerformance.map((t) => t.classroomCount);

  return (
    <>
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="text-center py-4">
              <h2 className="text-primary">{data.totalTeachers}</h2>
              <p className="text-muted mb-0">Total Profesores</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="text-center py-4">
              <h2 className="text-success">{data.averageStudentsPerTeacher.toFixed(1)}</h2>
              <p className="text-muted mb-0">Prom. Estudiantes/Profesor</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="text-center py-4">
              <h2 className="text-info">{data.averageClassroomsPerTeacher.toFixed(1)}</h2>
              <p className="text-muted mb-0">Prom. Clases/Profesor</p>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h6 className="mb-3">Comparacion de Profesores (Top 5)</h6>
              {radarSeries.length > 0 ? (
                <Chart
                  type="radar"
                  height={350}
                  options={{
                    xaxis: { categories: radarLabels },
                    yaxis: { max: 100 },
                    colors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
                  }}
                  series={radarSeries}
                />
              ) : (
                <p className="text-muted text-center">Sin datos</p>
              )}
            </CardBody>
          </Card>
        </Col>
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h6 className="mb-3">Carga de Trabajo</h6>
              {teacherNames.length > 0 ? (
                <Chart
                  type="bar"
                  height={350}
                  options={{
                    chart: { toolbar: { show: false }, stacked: false },
                    xaxis: { categories: teacherNames },
                    colors: ['#3b82f6', '#22c55e'],
                    plotOptions: { bar: { borderRadius: 4 } },
                  }}
                  series={[
                    { name: 'Estudiantes', data: teacherStudents },
                    { name: 'Clases', data: teacherClassrooms },
                  ]}
                />
              ) : (
                <p className="text-muted text-center">Sin datos</p>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <CardBody>
          <h6 className="mb-3">Ranking de Profesores</h6>
          <Table hover responsive size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Profesor</th>
                <th className="text-center">Clases</th>
                <th className="text-center">Estudiantes</th>
                <th className="text-center">Promedio</th>
                <th className="text-center">Aprobacion</th>
                <th className="text-center">Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {[...data.teacherPerformance]
                .sort((a, b) => b.averageGrade - a.averageGrade)
                .map((t, i) => (
                  <tr key={t.teacherId}>
                    <td>{i + 1}</td>
                    <td>{t.teacherName}</td>
                    <td className="text-center">{t.classroomCount}</td>
                    <td className="text-center">{t.totalStudents}</td>
                    <td className="text-center">
                      <Badge color={t.averageGrade >= 80 ? 'success' : t.averageGrade >= 70 ? 'warning' : 'danger'}>
                        {t.averageGrade.toFixed(1)}
                      </Badge>
                    </td>
                    <td className="text-center">{t.passRate.toFixed(0)}%</td>
                    <td className="text-center">{t.attendanceRate.toFixed(0)}%</td>
                  </tr>
                ))}
              {data.teacherPerformance.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted">Sin datos</td></tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  );
};

export default TeacherAnalyticsTab;
