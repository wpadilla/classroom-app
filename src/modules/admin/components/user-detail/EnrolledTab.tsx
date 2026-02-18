import React from 'react';
import { Alert, Badge, Table } from 'reactstrap';
import { IClassroom, IProgram, IUser } from '../../../../models';

interface EnrolledTabProps {
  currentUser: IUser;
  classrooms: IClassroom[];
  programs: IProgram[];
}

const EnrolledTab: React.FC<EnrolledTabProps> = ({ currentUser, classrooms, programs }) => {
  return (
    <div>
      <h6 className="mb-3">Clases en las que esta inscrito actualmente</h6>
      {(currentUser.enrolledClassrooms?.length || 0) > 0 ? (
        <Table size="sm" bordered striped>
          <thead>
            <tr>
              <th>Clase</th>
              <th>Programa</th>
              <th>Profesor</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {currentUser.enrolledClassrooms?.map(classroomId => {
              const classroom = classrooms.find(c => c.id === classroomId);
              const program = programs.find(p => p.id === classroom?.programId);
              return classroom ? (
                <tr key={classroomId}>
                  <td>{classroom.name}</td>
                  <td><small className="text-muted">{program?.name || '-'}</small></td>
                  <td><small>-</small></td>
                  <td>
                    <Badge color={classroom.isActive ? 'success' : 'secondary'}>
                      {classroom.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </td>
                </tr>
              ) : null;
            })}
          </tbody>
        </Table>
      ) : (
        <Alert color="info">No esta inscrito en ninguna clase actualmente</Alert>
      )}

      {currentUser.isTeacher && (
        <>
          <h6 className="mb-3 mt-4">Clases que imparte como profesor</h6>
          {(currentUser.teachingClassrooms?.length || 0) > 0 ? (
            <Table size="sm" bordered striped>
              <thead>
                <tr>
                  <th>Clase</th>
                  <th>Programa</th>
                  <th>Estudiantes</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {currentUser.teachingClassrooms?.map(classroomId => {
                  const classroom = classrooms.find(c => c.id === classroomId);
                  const program = programs.find(p => p.id === classroom?.programId);
                  return classroom ? (
                    <tr key={classroomId}>
                      <td>{classroom.name}</td>
                      <td><small className="text-muted">{program?.name || '-'}</small></td>
                      <td>{classroom.studentIds?.length || 0}</td>
                      <td>
                        <Badge color={classroom.isActive ? 'success' : 'secondary'}>
                          {classroom.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                    </tr>
                  ) : null;
                })}
              </tbody>
            </Table>
          ) : (
            <Alert color="info">No imparte ninguna clase actualmente</Alert>
          )}
        </>
      )}
    </div>
  );
};

export default EnrolledTab;
