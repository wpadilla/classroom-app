import React from 'react';
import { Row, Col, Card, CardBody } from 'reactstrap';
import Chart from 'react-apexcharts';
import { IStatisticsDashboard } from '../../../../models';

interface Props {
  data: IStatisticsDashboard;
}

const KPICard: React.FC<{ icon: string; value: string | number; label: string; color: string }> = ({
  icon, value, label, color,
}) => (
  <Col md={3} sm={6} className="mb-3">
    <Card className="border-0 shadow-sm h-100">
      <CardBody className="text-center py-4">
        <div className={`display-5 text-${color} mb-2`}>
          <i className={`bi ${icon}`}></i>
        </div>
        <h3 className="mb-1">{value}</h3>
        <p className="text-muted mb-0 small">{label}</p>
      </CardBody>
    </Card>
  </Col>
);

const StatisticsOverview: React.FC<Props> = ({ data }) => {
  const { enrollment, academic, attendance, programs } = data;

  // Students by program bar chart
  const programLabels = enrollment.enrollmentByProgram.map((p) => p.programName).slice(0, 8);
  const programValues = enrollment.enrollmentByProgram.map((p) => p.count).slice(0, 8);

  // Grade distribution donut
  const gradeLabels = ['Excelente (A)', 'Bueno (B)', 'Satisfactorio (C)', 'Necesita Mejora (D)', 'Reprobado (F)'];
  const gradeValues = [
    academic.gradeDistribution.excellent,
    academic.gradeDistribution.good,
    academic.gradeDistribution.satisfactory,
    academic.gradeDistribution.needsImprovement,
    academic.gradeDistribution.failing,
  ];

  // Monthly enrollment line
  const monthLabels = enrollment.newStudentsPerMonth.map((m) => {
    const [y, mo] = m.month.split('-');
    return `${mo}/${y.slice(2)}`;
  });
  const monthValues = enrollment.newStudentsPerMonth.map((m) => m.count);

  // Enrollment type pie
  const typeLabels = enrollment.enrollmentByType.map((t) => t.type);
  const typeValues = enrollment.enrollmentByType.map((t) => t.count);

  return (
    <>
      <Row>
        <KPICard icon="bi-people-fill" value={enrollment.totalStudents} label="Estudiantes" color="primary" />
        <KPICard icon="bi-collection-fill" value={programs.activePrograms} label="Programas Activos" color="success" />
        <KPICard icon="bi-award-fill" value={academic.overallAverageGrade.toFixed(1)} label="Promedio General" color="info" />
        <KPICard icon="bi-calendar-check-fill" value={`${attendance.overallAttendanceRate.toFixed(0)}%`} label="Asistencia General" color="warning" />
      </Row>

      <Row className="mt-2">
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h6 className="mb-3">Estudiantes por Programa</h6>
              {programLabels.length > 0 ? (
                <Chart
                  type="bar"
                  height={300}
                  options={{
                    chart: { toolbar: { show: false } },
                    xaxis: { categories: programLabels },
                    colors: ['#3b82f6'],
                    plotOptions: { bar: { borderRadius: 4 } },
                  }}
                  series={[{ name: 'Estudiantes', data: programValues }]}
                />
              ) : (
                <p className="text-muted text-center">Sin datos disponibles</p>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h6 className="mb-3">Distribucion de Calificaciones</h6>
              {gradeValues.some((v) => v > 0) ? (
                <Chart
                  type="donut"
                  height={300}
                  options={{
                    labels: gradeLabels,
                    colors: ['#22c55e', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'],
                    legend: { position: 'bottom' },
                  }}
                  series={gradeValues}
                />
              ) : (
                <p className="text-muted text-center">Sin datos disponibles</p>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h6 className="mb-3">Inscripciones Mensuales</h6>
              <Chart
                type="line"
                height={280}
                options={{
                  chart: { toolbar: { show: false } },
                  xaxis: { categories: monthLabels },
                  colors: ['#8b5cf6'],
                  stroke: { curve: 'smooth', width: 3 },
                  fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.1 } },
                }}
                series={[{ name: 'Nuevos Estudiantes', data: monthValues }]}
              />
            </CardBody>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h6 className="mb-3">Tipo de Inscripcion</h6>
              {typeLabels.length > 0 ? (
                <Chart
                  type="pie"
                  height={280}
                  options={{
                    labels: typeLabels,
                    colors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'],
                    legend: { position: 'bottom' },
                  }}
                  series={typeValues}
                />
              ) : (
                <p className="text-muted text-center">Sin datos disponibles</p>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default StatisticsOverview;
