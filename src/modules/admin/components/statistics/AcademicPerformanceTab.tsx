import React from 'react';
import { Row, Col, Card, CardBody, Table, Badge } from 'reactstrap';
import Chart from 'react-apexcharts';
import { IAcademicPerformance } from '../../../../models';

interface Props {
  data: IAcademicPerformance;
}

const AcademicPerformanceTab: React.FC<Props> = ({ data }) => {
  const programLabels = data.averageByProgram.map((p) => p.programName).slice(0, 10);
  const programValues = data.averageByProgram.map((p) => Number(p.averageGrade.toFixed(1))).slice(0, 10);

  const gradeLabels = ['Excelente', 'Bueno', 'Satisfactorio', 'Necesita Mejora', 'Reprobado'];
  const gradeValues = [
    data.gradeDistribution.excellent,
    data.gradeDistribution.good,
    data.gradeDistribution.satisfactory,
    data.gradeDistribution.needsImprovement,
    data.gradeDistribution.failing,
  ];

  const getGradeBadge = (grade: number) => {
    if (grade >= 90) return <Badge color="success">A</Badge>;
    if (grade >= 80) return <Badge color="primary">B</Badge>;
    if (grade >= 70) return <Badge color="warning">C</Badge>;
    if (grade >= 60) return <Badge color="secondary">D</Badge>;
    return <Badge color="danger">F</Badge>;
  };

  return (
    <>
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="text-center py-4">
              <h2 className="text-primary">{data.overallAverageGrade.toFixed(1)}</h2>
              <p className="text-muted mb-0">Promedio General</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="text-center py-4">
              <h2 className="text-success">{data.passRate.toFixed(1)}%</h2>
              <p className="text-muted mb-0">Tasa de Aprobacion</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="text-center py-4">
              <h2 className="text-danger">{data.failRate.toFixed(1)}%</h2>
              <p className="text-muted mb-0">Tasa de Reprobacion</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="text-center py-4">
              <h2 className="text-info">{data.totalEvaluated}</h2>
              <p className="text-muted mb-0">Total Evaluados</p>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h6 className="mb-3">Promedio por Programa</h6>
              {programLabels.length > 0 ? (
                <Chart
                  type="bar"
                  height={300}
                  options={{
                    chart: { toolbar: { show: false } },
                    xaxis: { categories: programLabels },
                    colors: ['#3b82f6'],
                    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                    yaxis: { max: 100 },
                  }}
                  series={[{ name: 'Promedio', data: programValues }]}
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
              <h6 className="mb-3">Distribucion de Notas</h6>
              {gradeValues.some((v) => v > 0) ? (
                <Chart
                  type="bar"
                  height={300}
                  options={{
                    chart: { toolbar: { show: false }, stacked: false },
                    xaxis: { categories: gradeLabels },
                    colors: ['#22c55e', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'],
                    plotOptions: { bar: { distributed: true, borderRadius: 4 } },
                    legend: { show: false },
                  }}
                  series={[{ name: 'Estudiantes', data: gradeValues }]}
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
          <h6 className="mb-3">Top 10 Mejores Estudiantes</h6>
          <Table hover responsive size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Estudiante</th>
                <th className="text-center">Promedio</th>
                <th className="text-center">Clases</th>
                <th className="text-center">Nota</th>
              </tr>
            </thead>
            <tbody>
              {data.topPerformers.map((tp, i) => (
                <tr key={tp.studentId}>
                  <td>{i + 1}</td>
                  <td>{tp.studentName}</td>
                  <td className="text-center">{tp.averageGrade.toFixed(1)}</td>
                  <td className="text-center">{tp.classroomCount}</td>
                  <td className="text-center">{getGradeBadge(tp.averageGrade)}</td>
                </tr>
              ))}
              {data.topPerformers.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted">Sin datos</td></tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  );
};

export default AcademicPerformanceTab;
