import React from 'react';
import { Row, Col, Card, CardBody, Table, Badge } from 'reactstrap';
import Chart from 'react-apexcharts';
import { IHistoricalTrends } from '../../../../models';

interface Props {
  data: IHistoricalTrends;
}

const TrendsTab: React.FC<Props> = ({ data }) => {
  // Multi-line chart: each classroom's runs as a series
  const runComparisonSeries = data.runComparisons
    .filter((rc) => rc.runs.length > 1)
    .slice(0, 5)
    .map((rc) => ({
      name: rc.classroomName,
      data: rc.runs.map((r) => Number(r.averageGrade.toFixed(1))),
    }));

  const maxRuns = Math.max(...data.runComparisons.map((rc) => rc.runs.length), 0);
  const runLabels = Array.from({ length: maxRuns }, (_, i) => `Ronda ${i + 1}`);

  return (
    <>
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="text-center py-4">
              <h2 className="text-primary">{data.totalRuns}</h2>
              <p className="text-muted mb-0">Total de Rondas</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="text-center py-4">
              <h2 className="text-success">{data.averageRunGrade.toFixed(1)}</h2>
              <p className="text-muted mb-0">Promedio Historico</p>
            </CardBody>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="text-center py-4">
              <h2 className="text-info">{data.averageRunPassRate.toFixed(0)}%</h2>
              <p className="text-muted mb-0">Tasa Aprobacion Historica</p>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {runComparisonSeries.length > 0 && (
        <Row>
          <Col lg={12} className="mb-4">
            <Card className="border-0 shadow-sm">
              <CardBody>
                <h6 className="mb-3">Comparacion entre Rondas (Promedio)</h6>
                <Chart
                  type="line"
                  height={350}
                  options={{
                    chart: { toolbar: { show: false } },
                    xaxis: { categories: runLabels },
                    colors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
                    stroke: { curve: 'smooth', width: 3 },
                    yaxis: { max: 100, title: { text: 'Promedio' } },
                    legend: { position: 'top' },
                  }}
                  series={runComparisonSeries}
                />
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}

      <Card className="border-0 shadow-sm">
        <CardBody>
          <h6 className="mb-3">Historial de Rondas por Clase</h6>
          {data.runComparisons.length > 0 ? (
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              <Table hover responsive size="sm">
                <thead>
                  <tr>
                    <th>Clase</th>
                    <th className="text-center">Ronda</th>
                    <th className="text-center">Estudiantes</th>
                    <th className="text-center">Promedio</th>
                    <th className="text-center">Aprobacion</th>
                    <th className="text-center">Asistencia</th>
                    <th>Periodo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.runComparisons.flatMap((rc) =>
                    rc.runs.map((run, i) => (
                      <tr key={`${rc.classroomId}-${run.runNumber}`}>
                        {i === 0 ? (
                          <td rowSpan={rc.runs.length} style={{ verticalAlign: 'middle' }}>
                            <strong>{rc.classroomName}</strong>
                          </td>
                        ) : null}
                        <td className="text-center">
                          <Badge color="secondary">#{run.runNumber}</Badge>
                        </td>
                        <td className="text-center">{run.studentCount}</td>
                        <td className="text-center">
                          <Badge color={run.averageGrade >= 80 ? 'success' : run.averageGrade >= 70 ? 'warning' : 'danger'}>
                            {run.averageGrade.toFixed(1)}
                          </Badge>
                        </td>
                        <td className="text-center">{run.passRate.toFixed(0)}%</td>
                        <td className="text-center">{run.attendanceRate.toFixed(0)}%</td>
                        <td>
                          <small className="text-muted">
                            {run.startDate ? new Date(run.startDate).toLocaleDateString('es-DO') : '?'} -{' '}
                            {run.endDate ? new Date(run.endDate).toLocaleDateString('es-DO') : '?'}
                          </small>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          ) : (
            <p className="text-muted text-center">No hay datos historicos de rondas anteriores.</p>
          )}
        </CardBody>
      </Card>
    </>
  );
};

export default TrendsTab;
