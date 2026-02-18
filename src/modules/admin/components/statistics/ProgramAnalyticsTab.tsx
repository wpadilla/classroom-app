import React from 'react';
import { Row, Col, Card, CardBody, Table, Progress } from 'reactstrap';
import Chart from 'react-apexcharts';
import { IProgramAnalytics } from '../../../../models';

interface Props {
  data: IProgramAnalytics;
}

const ProgramAnalyticsTab: React.FC<Props> = ({ data }) => {
  const completionLabels = data.completionRates.map((p) => p.programName);
  const completionValues = data.completionRates.map((p) => Number(p.completionRate.toFixed(1)));

  const utilizationLabels = data.classroomUtilization.map((c) => c.classroomName).slice(0, 10);
  const utilizationValues = data.classroomUtilization.map((c) => Number(c.utilization.toFixed(1))).slice(0, 10);

  return (
    <>
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="text-center py-4">
              <h2 className="text-primary">{data.totalPrograms}</h2>
              <p className="text-muted mb-0">Total Programas</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="text-center py-4">
              <h2 className="text-success">{data.activePrograms}</h2>
              <p className="text-muted mb-0">Programas Activos</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="text-center py-4">
              <h2 className="text-info">{data.totalPrograms - data.activePrograms}</h2>
              <p className="text-muted mb-0">Programas Inactivos</p>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h6 className="mb-3">Tasa de Completitud por Programa</h6>
              {completionLabels.length > 0 ? (
                <Chart
                  type="bar"
                  height={300}
                  options={{
                    chart: { toolbar: { show: false } },
                    xaxis: { categories: completionLabels },
                    colors: ['#8b5cf6'],
                    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                    yaxis: { max: 100 },
                  }}
                  series={[{ name: 'Completitud', data: completionValues }]}
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
              <h6 className="mb-3">Utilizacion de Clases</h6>
              {utilizationLabels.length > 0 ? (
                <Chart
                  type="radialBar"
                  height={300}
                  options={{
                    labels: utilizationLabels.slice(0, 5),
                    colors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
                    plotOptions: { radialBar: { dataLabels: { name: { fontSize: '10px' } } } },
                  }}
                  series={utilizationValues.slice(0, 5)}
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
          <h6 className="mb-3">Detalle de Programas</h6>
          <Table hover responsive size="sm">
            <thead>
              <tr>
                <th>Programa</th>
                <th className="text-center">Clases</th>
                <th className="text-center">Activas</th>
                <th className="text-center">Completadas</th>
                <th className="text-center">Estudiantes</th>
                <th style={{ width: '20%' }}>Completitud</th>
              </tr>
            </thead>
            <tbody>
              {data.completionRates.map((p) => (
                <tr key={p.programId}>
                  <td>{p.programName}</td>
                  <td className="text-center">{p.totalClassrooms}</td>
                  <td className="text-center">{p.activeClassrooms}</td>
                  <td className="text-center">{p.completedClassrooms}</td>
                  <td className="text-center">{p.totalStudents}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <Progress
                        value={p.completionRate}
                        style={{ flex: 1, height: 8 }}
                        color={p.completionRate > 70 ? 'success' : p.completionRate > 40 ? 'warning' : 'danger'}
                      />
                      <small>{p.completionRate.toFixed(0)}%</small>
                    </div>
                  </td>
                </tr>
              ))}
              {data.completionRates.length === 0 && (
                <tr><td colSpan={6} className="text-center text-muted">Sin datos</td></tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  );
};

export default ProgramAnalyticsTab;
