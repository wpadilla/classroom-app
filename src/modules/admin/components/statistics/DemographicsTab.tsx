import React from 'react';
import { Row, Col, Card, CardBody, Table } from 'reactstrap';
import Chart from 'react-apexcharts';
import { IDemographicAnalytics } from '../../../../models';

interface Props {
  data: IDemographicAnalytics;
}

const DemographicsTab: React.FC<Props> = ({ data }) => {
  const countryLabels = data.studentsByCountry.map((c) => c.country).slice(0, 10);
  const countryValues = data.studentsByCountry.map((c) => c.count).slice(0, 10);

  const churchLabels = data.studentsByChurch.map((c) => c.church).slice(0, 10);
  const churchValues = data.studentsByChurch.map((c) => c.count).slice(0, 10);

  const levelLabels = data.studentsByAcademicLevel.map((l) => l.level);
  const levelValues = data.studentsByAcademicLevel.map((l) => l.count);

  const typeLabels = data.studentsByEnrollmentType.map((t) => t.type);
  const typeValues = data.studentsByEnrollmentType.map((t) => t.count);

  return (
    <>
      <Row>
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h6 className="mb-3">Estudiantes por Pais</h6>
              {countryLabels.length > 0 ? (
                <Chart
                  type="pie"
                  height={300}
                  options={{
                    labels: countryLabels,
                    colors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'],
                    legend: { position: 'bottom' },
                  }}
                  series={countryValues}
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
              <h6 className="mb-3">Estudiantes por Iglesia (Top 10)</h6>
              {churchLabels.length > 0 ? (
                <Chart
                  type="bar"
                  height={300}
                  options={{
                    chart: { toolbar: { show: false } },
                    xaxis: { categories: churchLabels },
                    colors: ['#22c55e'],
                    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                  }}
                  series={[{ name: 'Estudiantes', data: churchValues }]}
                />
              ) : (
                <p className="text-muted text-center">Sin datos</p>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h6 className="mb-3">Nivel Academico</h6>
              {levelLabels.length > 0 ? (
                <Chart
                  type="donut"
                  height={300}
                  options={{
                    labels: levelLabels,
                    colors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
                    legend: { position: 'bottom' },
                  }}
                  series={levelValues}
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
              <h6 className="mb-3">Tipo de Inscripcion</h6>
              {typeLabels.length > 0 ? (
                <Chart
                  type="donut"
                  height={300}
                  options={{
                    labels: typeLabels,
                    colors: ['#8b5cf6', '#22c55e', '#f59e0b'],
                    legend: { position: 'bottom' },
                  }}
                  series={typeValues}
                />
              ) : (
                <p className="text-muted text-center">Sin datos</p>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h6 className="mb-3">Detalle por Pais</h6>
              <Table hover responsive size="sm">
                <thead>
                  <tr>
                    <th>Pais</th>
                    <th className="text-center">Estudiantes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.studentsByCountry.map((c, i) => (
                    <tr key={i}>
                      <td>{c.country}</td>
                      <td className="text-center">{c.count}</td>
                    </tr>
                  ))}
                  {data.studentsByCountry.length === 0 && (
                    <tr><td colSpan={2} className="text-center text-muted">Sin datos</td></tr>
                  )}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h6 className="mb-3">Detalle por Iglesia</h6>
              <Table hover responsive size="sm">
                <thead>
                  <tr>
                    <th>Iglesia</th>
                    <th className="text-center">Estudiantes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.studentsByChurch.map((c, i) => (
                    <tr key={i}>
                      <td>{c.church}</td>
                      <td className="text-center">{c.count}</td>
                    </tr>
                  ))}
                  {data.studentsByChurch.length === 0 && (
                    <tr><td colSpan={2} className="text-center text-muted">Sin datos</td></tr>
                  )}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default DemographicsTab;
