// ProgramsProgressTab Component
// Reusable component to display user's program progress
// Can be used in UserDetailModal, UserProfile, and other contexts

import React, { useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  CardBody,
  Badge,
  Progress,
  Table,
  Spinner,
  Alert,
} from 'reactstrap';
import { IUser } from '../../../models';
import { useProgramProgress, ProgramProgress } from '../../../hooks/useProgramProgress';

interface ProgramsProgressTabProps {
  user: IUser;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

const ProgramsProgressTab: React.FC<ProgramsProgressTabProps> = ({
  user,
  className = '',
  showDetails = true,
  compact = false,
}) => {
  const { programProgress, overallStats, loading, calculateProgress } = useProgramProgress();

  useEffect(() => {
    if (user) {
      calculateProgress(user);
    }
  }, [calculateProgress, user]);

  // Get grade color based on score
  const getGradeColor = (grade: number): string => {
    if (grade >= 90) return 'success';
    if (grade >= 80) return 'info';
    if (grade >= 70) return 'warning';
    return 'danger';
  };

  // Get progress bar color
  const getProgressColor = (percentage: number): string => {
    if (percentage === 100) return 'success';
    if (percentage >= 50) return 'primary';
    if (percentage >= 25) return 'info';
    return 'warning';
  };

  if (loading) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <Spinner color="primary" />
        <p className="mt-2 mb-0">Calculando progreso...</p>
      </div>
    );
  }

  if (programProgress.length === 0) {
    return (
      <div className={className}>
        <Alert color="info" className="mb-0">
          <i className="bi bi-info-circle me-2"></i>
          No hay progreso en programas registrado para este usuario.
        </Alert>
      </div>
    );
  }

  // Compact view for sidebar or small spaces
  if (compact) {
    return (
      <div className={className}>
        <div className="mb-3">
          <small className="text-muted d-block mb-1">Progreso General</small>
          <div className="d-flex align-items-center">
            <Progress
              value={overallStats.averageProgress}
              color={getProgressColor(overallStats.averageProgress)}
              className="flex-grow-1 me-2"
              style={{ height: '8px' }}
            />
            <small className="fw-bold">{overallStats.averageProgress}%</small>
          </div>
          {overallStats.overallAverage > 0 && (
            <small className="text-muted">
              Promedio: {overallStats.overallAverage}%
            </small>
          )}
        </div>
        
        {programProgress.map((prog: ProgramProgress) => (
          <div key={prog.program.id} className="mb-2">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-truncate" style={{ maxWidth: '150px' }}>
                {prog.program.name}
              </small>
              <Badge 
                color={getProgressColor(prog.progressPercentage)} 
                pill
              >
                {prog.completedClassrooms}/{prog.totalClassrooms}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Full view for detailed display
  return (
    <div className={className}>
      {/* Overall Stats */}
      <Card className="mb-3 bg-light">
        <CardBody>
          <Row className="align-items-center">
            <Col md={3} className="text-center mb-3 mb-md-0">
              <h2 className="mb-0 text-primary">{overallStats.totalClassroomsCompleted}</h2>
              <small className="text-muted">Clases Completadas</small>
            </Col>
            <Col md={3} className="text-center mb-3 mb-md-0">
              <h2 className="mb-0 text-info">{overallStats.totalClassroomsEnrolled}</h2>
              <small className="text-muted">Clases Actuales</small>
            </Col>
            <Col md={3} className="text-center mb-3 mb-md-0">
              <h2 className="mb-0">
                <Badge color={getGradeColor(overallStats.overallAverage || 0)}>
                  {overallStats.overallAverage || '-'}%
                </Badge>
              </h2>
              <small className="text-muted">Promedio General</small>
            </Col>
            <Col md={3} className="text-center">
              <h2 className="mb-0 text-success">{overallStats.averageProgress}%</h2>
              <small className="text-muted">Progreso Total</small>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Per-Program Progress */}
      <Row>
        {programProgress.map((prog: ProgramProgress) => (
          <Col md={6} key={prog.program.id} className="mb-3">
            <Card className="h-100">
              <CardBody>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="mb-0">
                    <i className="bi bi-journal-bookmark me-2 text-primary"></i>
                    {prog.program.name}
                  </h6>
                  {prog.progressPercentage === 100 && (
                    <Badge color="success">
                      <i className="bi bi-check-circle me-1"></i>
                      Completado
                    </Badge>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small className="text-muted">
                      {prog.completedClassrooms} de {prog.totalClassrooms} clases
                    </small>
                    <small className="fw-bold">{prog.progressPercentage}%</small>
                  </div>
                  <Progress
                    value={prog.progressPercentage}
                    color={getProgressColor(prog.progressPercentage)}
                  />
                </div>

                {/* Stats Badges */}
                <div className="mb-3">
                  {prog.averageGrade > 0 && (
                    <Badge color={getGradeColor(prog.averageGrade)} className="me-2">
                      <i className="bi bi-star me-1"></i>
                      Promedio: {prog.averageGrade}%
                    </Badge>
                  )}
                  {prog.enrolledClassrooms > 0 && (
                    <Badge color="info">
                      <i className="bi bi-play me-1"></i>
                      {prog.enrolledClassrooms} en curso
                    </Badge>
                  )}
                </div>

                {/* Classroom Details */}
                {showDetails && prog.classroomDetails.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-muted small mb-2" style={{ cursor: 'pointer' }}>
                      <i className="bi bi-list-ul me-1"></i>
                      Ver detalle de clases ({prog.classroomDetails.length})
                    </summary>
                    <Table size="sm" borderless className="mb-0 mt-2">
                      <tbody>
                        {prog.classroomDetails.map((detail, idx) => (
                          <tr key={idx}>
                            <td className="ps-0 py-1" style={{ width: '24px' }}>
                              {detail.status === 'completed' && (
                                <i className="bi bi-check-circle-fill text-success"></i>
                              )}
                              {detail.status === 'enrolled' && (
                                <i className="bi bi-play-circle-fill text-primary"></i>
                              )}
                              {detail.status === 'not-started' && (
                                <i className="bi bi-circle text-muted"></i>
                              )}
                            </td>
                            <td className="py-1">
                              <small>{detail.classroom.name}</small>
                              {detail.status === 'enrolled' && (
                                <Badge color="info" pill className="ms-2" style={{ fontSize: '0.6rem' }}>
                                  En curso
                                </Badge>
                              )}
                            </td>
                            <td className="text-end pe-0 py-1" style={{ width: '60px' }}>
                              {detail.finalGrade !== undefined && detail.finalGrade > 0 && (
                                <Badge color={getGradeColor(detail.finalGrade)} pill>
                                  {detail.finalGrade}%
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </details>
                )}
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ProgramsProgressTab;
