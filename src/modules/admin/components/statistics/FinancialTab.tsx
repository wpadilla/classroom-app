import React from 'react';
import { Row, Col, Card, CardBody, Table } from 'reactstrap';
import Chart from 'react-apexcharts';
import { IFinancialOverview } from '../../../../models';

interface Props {
  data: IFinancialOverview;
}

const formatCurrency = (amount: number): string => `RD$ ${amount.toLocaleString('es-DO')}`;

const FinancialTab: React.FC<Props> = ({ data }) => {
  const programLabels = data.revenueByProgram.map((p) => p.programName);
  const programValues = data.revenueByProgram.map((p) => p.revenue);

  return (
    <>
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100 bg-success text-white">
            <CardBody className="text-center py-4">
              <h2>{formatCurrency(data.totalMaterialRevenue)}</h2>
              <p className="mb-0">Ingresos por Materiales</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="text-center py-4">
              <h2 className="text-primary">{formatCurrency(data.averageCostPerStudent)}</h2>
              <p className="text-muted mb-0">Costo Prom. por Estudiante</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="text-center py-4">
              <h2 className="text-info">{data.revenueByClassroom.length}</h2>
              <p className="text-muted mb-0">Clases con Ingresos</p>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={12} className="mb-4">
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h6 className="mb-3">Ingresos por Programa</h6>
              {programLabels.length > 0 ? (
                <Chart
                  type="bar"
                  height={300}
                  options={{
                    chart: { toolbar: { show: false } },
                    xaxis: { categories: programLabels },
                    colors: ['#22c55e'],
                    plotOptions: { bar: { borderRadius: 4 } },
                    yaxis: { labels: { formatter: (v: number) => `RD$ ${v.toLocaleString()}` } },
                    tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
                  }}
                  series={[{ name: 'Ingresos', data: programValues }]}
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
              <h6 className="mb-3">Detalle por Programa</h6>
              <Table hover responsive size="sm">
                <thead>
                  <tr>
                    <th>Programa</th>
                    <th className="text-center">Estudiantes</th>
                    <th className="text-end">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {data.revenueByProgram.map((p) => (
                    <tr key={p.programId}>
                      <td>{p.programName}</td>
                      <td className="text-center">{p.studentCount}</td>
                      <td className="text-end">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                  {data.revenueByProgram.length === 0 && (
                    <tr><td colSpan={3} className="text-center text-muted">Sin datos</td></tr>
                  )}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h6 className="mb-3">Detalle por Clase</h6>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <Table hover responsive size="sm">
                  <thead>
                    <tr>
                      <th>Clase</th>
                      <th className="text-center">Estudiantes</th>
                      <th className="text-end">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.revenueByClassroom
                      .sort((a, b) => b.revenue - a.revenue)
                      .map((c) => (
                        <tr key={c.classroomId}>
                          <td>{c.classroomName}</td>
                          <td className="text-center">{c.students}</td>
                          <td className="text-end">{formatCurrency(c.revenue)}</td>
                        </tr>
                      ))}
                    {data.revenueByClassroom.length === 0 && (
                      <tr><td colSpan={3} className="text-center text-muted">Sin datos</td></tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default FinancialTab;
