// Admin Dashboard Component

import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  CardText,
  Button,
  Badge,
  Spinner
} from 'reactstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/user/user.service';
import { ProgramService } from '../../services/program/program.service';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalPrograms: 0,
    activePrograms: 0
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const [userStats, programs] = await Promise.all([
        UserService.getUserStatistics(),
        ProgramService.getAllPrograms()
      ]);

      setStats({
        totalUsers: userStats.totalUsers,
        totalStudents: userStats.totalStudents,
        totalTeachers: userStats.totalTeachers,
        totalPrograms: programs.length,
        activePrograms: programs.filter(p => p.isActive).length
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-3">Cargando panel de administración...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="display-6">Panel de Administración</h1>
        <p className="text-muted">
          Bienvenido, {user?.firstName} {user?.lastName}
        </p>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-4 text-primary mb-2">
                <i className="bi bi-people-fill"></i>
              </div>
              <CardTitle tag="h5">{stats.totalUsers}</CardTitle>
              <CardText className="text-muted">Usuarios Totales</CardText>
              <Button tag={Link} to="/admin/users" color="primary" size="sm">
                Ver Usuarios
              </Button>
            </CardBody>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-4 text-success mb-2">
                <i className="bi bi-mortarboard-fill"></i>
              </div>
              <CardTitle tag="h5">{stats.totalStudents}</CardTitle>
              <CardText className="text-muted">Estudiantes</CardText>
              <Button tag={Link} to="/admin/users?role=student" color="success" size="sm">
                Ver Estudiantes
              </Button>
            </CardBody>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-4 text-info mb-2">
                <i className="bi bi-person-workspace"></i>
              </div>
              <CardTitle tag="h5">{stats.totalTeachers}</CardTitle>
              <CardText className="text-muted">Profesores</CardText>
              <Button tag={Link} to="/admin/users?role=teacher" color="info" size="sm">
                Ver Profesores
              </Button>
            </CardBody>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <CardBody className="text-center">
              <div className="display-4 text-warning mb-2">
                <i className="bi bi-collection-fill"></i>
              </div>
              <CardTitle tag="h5">
                {stats.activePrograms}/{stats.totalPrograms}
              </CardTitle>
              <CardText className="text-muted">Programas Activos</CardText>
              <Button tag={Link} to="/admin/programs" color="warning" size="sm">
                Ver Programas
              </Button>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row>
        <Col md={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h5 className="mb-3">
                <i className="bi bi-lightning-fill text-primary me-2"></i>
                Acciones Rápidas
              </h5>
              <div className="d-grid gap-2">
                <Button tag={Link} to="/admin/users" color="outline-primary">
                  <i className="bi bi-person-plus me-2"></i>
                  Agregar Nuevo Usuario
                </Button>
                <Button tag={Link} to="/admin/programs" color="outline-primary">
                  <i className="bi bi-plus-circle me-2"></i>
                  Crear Nuevo Programa
                </Button>
                <Button tag={Link} to="/admin/classrooms" color="outline-primary">
                  <i className="bi bi-calendar-plus me-2"></i>
                  Crear Nueva Clase
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col md={6} className="mb-3">
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h5 className="mb-3">
                <i className="bi bi-whatsapp text-success me-2"></i>
                WhatsApp
              </h5>
              <div className="d-grid gap-2">
                <Button 
                  tag={Link} 
                  to="/admin/whatsapp"
                  color="outline-success"
                >
                  <i className="bi bi-qr-code me-2"></i>
                  Gestionar WhatsApp
                </Button>
                <Button 
                  tag={Link} 
                  to="/admin/whatsapp/groups"
                  color="outline-success"
                >
                  <i className="bi bi-people me-2"></i>
                  Administrar Grupos
                </Button>
                <Button 
                  tag={Link} 
                  to="/admin/whatsapp/bulk-messaging"
                  color="outline-success"
                >
                  <i className="bi bi-send me-2"></i>
                  Enviar Mensaje Masivo
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;
