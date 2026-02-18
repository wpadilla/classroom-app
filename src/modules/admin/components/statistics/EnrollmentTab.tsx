import React from 'react';
import { Row, Col, Card, CardBody, Table } from 'reactstrap';
import Chart from 'react-apexcharts';
import { IEnrollmentAnalytics } from '../../../../models';

interface Props {
  data: IEnrollmentAnalytics;
}

const EnrollmentTab: React.FC<Props> = ({ data }) => {
  const monthLabels = data.newStudentsPerMonth.map((m) => {
    const [y, mo] = m.month.split('-');
    return `${mo}/${y.slice(2)}`;
  });
  const monthValues = data.newStudentsPerMonth.map((m) => m.count);

  const programLabels = data.enrollmentByProgram.map((p) => p.programName);
  const programValues = data.enrollmentByProgram.map((p) => p.count);

  const categoryLabels = data.enrollmentByCategory.map((c) => c.category);
  const categoryValues = data.enrollmentByCategory.map((c) => c.count);

  return (
    <>
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100 bg-primary text-white">
            <CardBody className="text-center py-4">
              <h2>{data.totalStudents}</h2>
              <p className="mb-0">Total Estudiantes</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100 bg-success text-white">
            <CardBody className="text-center py-4">
              <h2>{data.activeStudents}</h2>
              <p className="mb-0">Estudiantes Activos</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100 bg-info text-white">
            <CardBody className="text-center py-4">
              <h2>{data.retentionRate.toFixed(1)}%</h2>
              <p className="mb-0">Tasa de Retencion</p>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={8} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h6 className="mb-3">Tendencia de Inscripciones (12 meses)</h6>
              <Chart
                type="line"
                height={300}
                options={{
                  chart: { toolbar: { show: false } },
                  xaxis: { categories: monthLabels },
                  colors: ['#3b82f6'],
                  stroke: { curve: 'smooth', width: 3 },
                  fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.1 } },
                }}
                series={[{ name: 'Nuevos', data: monthValues }]}
              />
            </CardBody>
          </Card>
        </Col>
        <Col lg={4} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h6 className="mb-3">Por Categoria</h6>
              {categoryLabels.length > 0 ? (
                <Chart
                  type="pie"
                  height={280}
                  options={{
                    labels: categoryLabels,
                    colors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
                    legend: { position: 'bottom' },
                  }}
                  series={categoryValues}
                />
              ) : (
                <p className="text-muted text-center">Sin datos</p>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={12} className="mb-4">
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h6 className="mb-3">Estudiantes por Programa</h6>
              {programLabels.length > 0 ? (
                <Chart
                  type="bar"
                  height={300}
                  options={{
                    chart: { toolbar: { show: false } },
                    xaxis: { categories: programLabels },
                    colors: ['#8b5cf6'],
                    plotOptions: { bar: { borderRadius: 4, horizontal: true } },
                  }}
                  series={[{ name: 'Estudiantes', data: programValues }]}
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
          <h6 className="mb-3">Detalle por Tipo de Inscripcion</h6>
          <Table hover responsive size="sm">
            <thead>
              <tr>
                <th>Tipo</th>
                <th className="text-center">Cantidad</th>
                <th className="text-center">Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              {data.enrollmentByType.map((t, i) => (
                <tr key={i}>
                  <td>{t.type}</td>
                  <td className="text-center">{t.count}</td>
                  <td className="text-center">
                    {data.totalStudents > 0 ? ((t.count / data.totalStudents) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  );
};

export default EnrollmentTab;
