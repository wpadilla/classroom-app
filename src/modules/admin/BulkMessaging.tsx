// Bulk Messaging Component - Admin Only
// Send messages to multiple WhatsApp groups at once

import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Input,
  InputGroup,
  InputGroupText,
  Form,
  FormGroup,
  Label,
  Spinner,
  Alert,
  Table,
  Progress,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ClassroomService } from '../../services/classroom/classroom.service';
import { WhatsappService } from '../../services/whatsapp/whatsapp.service';
import { UserService } from '../../services/user/user.service';
import { EvaluationService } from '../../services/evaluation/evaluation.service';
import { IClassroom, IWhatsappMessage, IUser } from '../../models';

interface SendingProgress {
  classroomId: string;
  classroomName: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  error?: string;
}

const BulkMessaging: React.FC = () => {
  const navigate = useNavigate();

  // Classrooms state
  const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Teachers cache for displaying teacher names
  const [teachers, setTeachers] = useState<Map<string, IUser>>(new Map());
  
  // Selection state
  const [selectedClassrooms, setSelectedClassrooms] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Individual sending state - tracks which classrooms will send to individuals vs group
  const [sendToIndividuals, setSendToIndividuals] = useState<Map<string, boolean>>(new Map());
  
  // State to track excluded students per classroom
  const [excludedStudents, setExcludedStudents] = useState<Map<string, Set<string>>>(new Map());
  
  // State to track students per classroom (for displaying in accordion)
  const [classroomStudents, setClassroomStudents] = useState<Map<string, IUser[]>>(new Map());
  
  // State to track which accordions are open
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
  
  // Message state
  const [messageType, setMessageType] = useState<'text' | 'image'>('text');
  const [messageContent, setMessageContent] = useState('');
  const [messageFile, setMessageFile] = useState<File | null>(null);
  const [messageCaption, setMessageCaption] = useState('');
  const [messageDelay, setMessageDelay] = useState(5);
  
  // Sending state
  const [sending, setSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState<SendingProgress[]>([]);
  const [progressModal, setProgressModal] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    try {
      setLoading(true);
      const allClassrooms = await ClassroomService.getAllClassrooms();
      // Filter only classrooms with WhatsApp groups
      const withGroups = allClassrooms.filter(c => c.whatsappGroup && c.isActive);
      setClassrooms(withGroups);
      
      // Load teachers for all classrooms
      const teacherIds = Array.from(new Set(withGroups.map(c => c.teacherId)));
      const teachersData = await Promise.all(
        teacherIds.map(id => UserService.getUserById(id))
      );
      
      const teachersMap = new Map<string, IUser>();
      teachersData.forEach(teacher => {
        if (teacher) {
          teachersMap.set(teacher.id, teacher);
        }
      });
      setTeachers(teachersMap);
    } catch (error) {
      console.error('Error loading classrooms:', error);
      toast.error('Error al cargar las clases');
    } finally {
      setLoading(false);
    }
  };

  const filteredClassrooms = classrooms.filter(c => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(searchLower) ||
      c.subject.toLowerCase().includes(searchLower) ||
      c.whatsappGroup?.name?.toLowerCase().includes(searchLower)
    );
  });

  const handleSelectClassroom = (classroomId: string) => {
    const newSelection = new Set(selectedClassrooms);
    if (newSelection.has(classroomId)) {
      newSelection.delete(classroomId);
    } else {
      newSelection.add(classroomId);
    }
    setSelectedClassrooms(newSelection);
    setSelectAll(newSelection.size === filteredClassrooms.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedClassrooms(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredClassrooms.map(c => c.id));
      setSelectedClassrooms(allIds);
      setSelectAll(true);
    }
  };

  const handleToggleIndividualSending = async (classroomId: string, sendIndividual: boolean) => {
    const newMap = new Map(sendToIndividuals);
    newMap.set(classroomId, sendIndividual);
    setSendToIndividuals(newMap);
    
    // If enabling individual sending and we don't have students loaded yet, load them
    if (sendIndividual && !classroomStudents.has(classroomId)) {
      try {
        const students = await UserService.getUsersByClassroom(classroomId);
        // Filter students with valid phone numbers
        const validStudents = students.filter(student => {
          if (!student.phone) return false;
          const digits = student.phone.replace(/\D/g, '');
          return digits.length >= 10;
        });
        
        setClassroomStudents(prev => {
          const newMap = new Map(prev);
          newMap.set(classroomId, validStudents);
          return newMap;
        });
        
        // Initialize all students as included (not excluded)
        setExcludedStudents(prev => {
          const newMap = new Map(prev);
          if (!newMap.has(classroomId)) {
            newMap.set(classroomId, new Set());
          }
          return newMap;
        });
      } catch (error) {
        console.error('Error loading students:', error);
        toast.error('Error al cargar los estudiantes');
      }
    }
  };
  
  const toggleStudentExclusion = (classroomId: string, studentId: string) => {
    setExcludedStudents(prev => {
      const newMap = new Map(prev);
      const excluded = newMap.get(classroomId) || new Set();
      const newExcluded = new Set(excluded);
      
      if (newExcluded.has(studentId)) {
        newExcluded.delete(studentId);
      } else {
        newExcluded.add(studentId);
      }
      
      newMap.set(classroomId, newExcluded);
      return newMap;
    });
  };
  
  const toggleAccordion = (classroomId: string) => {
    setOpenAccordions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classroomId)) {
        newSet.delete(classroomId);
      } else {
        newSet.add(classroomId);
      }
      return newSet;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor seleccione una imagen válida');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 5MB');
        return;
      }
      
      setMessageFile(file);
    }
  };

  const validateMessage = (): boolean => {
    if (selectedClassrooms.size === 0) {
      toast.error('Por favor seleccione al menos una clase');
      return false;
    }

    if (messageType === 'text' && !messageContent.trim()) {
      toast.error('Por favor ingrese un mensaje');
      return false;
    }

    if (messageType === 'image' && !messageFile) {
      toast.error('Por favor seleccione una imagen');
      return false;
    }

    return true;
  };

  const handleSendMessages = async () => {
    if (!validateMessage()) return;

    if (!window.confirm(`¿Está seguro que desea enviar este mensaje a ${selectedClassrooms.size} grupos?`)) {
      return;
    }

    try {
      setSending(true);
      setProgressModal(true);
      
      // Initialize progress tracking
      const progress: SendingProgress[] = Array.from(selectedClassrooms).map(id => {
        const classroom = classrooms.find(c => c.id === id);
        return {
          classroomId: id,
          classroomName: classroom?.subject || 'Clase',
          status: 'pending'
        };
      });
      setSendingProgress(progress);
      setCurrentProgress(0);

      // Send messages one by one
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < progress.length; i++) {
        const item = progress[i];
        const classroom = classrooms.find(c => c.id === item.classroomId);
        
        if (!classroom?.whatsappGroup) {
          progress[i].status = 'failed';
          progress[i].error = 'Grupo no encontrado';
          failCount++;
          setSendingProgress([...progress]);
          continue;
        }

        try {
          // Update status to sending
          progress[i].status = 'sending';
          setSendingProgress([...progress]);

          // Prepare message
          const message: IWhatsappMessage = {
            type: messageType,
            content: messageType === 'text' ? messageContent : messageCaption,
            media: messageType === 'image' ? {
              caption: messageCaption
            } : undefined
          };

          // Check if sending to individuals or to group
          const sendIndividual = sendToIndividuals.get(item.classroomId) || false;

          if (sendIndividual) {
            // Send to each student individually
            const students = await UserService.getUsersByClassroom(item.classroomId);
            
            // Filter students with valid phone numbers (at least 10 digits)
            const validStudents = students.filter(student => {
              if (!student.phone) return false;
              const digits = student.phone.replace(/\D/g, '');
              return digits.length >= 10;
            });

            if (validStudents.length === 0) {
              progress[i].status = 'failed';
              progress[i].error = 'No hay estudiantes con teléfonos válidos';
              failCount++;
              setSendingProgress([...progress]);
              continue;
            }

            // Get classroom properties with fallback to space
            const teacher = teachers.get(classroom.teacherId);
            const teacherName = teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || ' ' : ' ';
            const schedule = classroom.schedule 
              ? `${classroom.schedule.dayOfWeek || ''} a las ${classroom.schedule.time || ''} (${classroom.schedule.duration || ''} min)`.trim() || ' '
              : ' ';
            
            // Filter out excluded students
            const excludedSet = excludedStudents.get(item.classroomId) || new Set();
            const includedStudents = validStudents.filter(student => !excludedSet.has(student.id));
            
            if (includedStudents.length === 0) {
              progress[i].status = 'failed';
              progress[i].error = 'No hay estudiantes incluidos para enviar';
              failCount++;
              setSendingProgress([...progress]);
              continue;
            }
            
            // Get evaluations for all students to include score and absent times
            const studentContacts = await Promise.all(
              includedStudents.map(async (student) => {
                let score = 0;
                let absentTimes = 0;

                try {
                  // Get student evaluation
                  const evaluation = await EvaluationService.getStudentClassroomEvaluation(
                    student.id,
                    item.classroomId
                  );

                  if (evaluation) {
                    // Calculate total score from all evaluation components
                    const scores = evaluation.scores || {
                      questionnaires: 0,
                      attendance: 0,
                      participation: 0,
                      finalExam: 0,
                      customScores: []
                    };

                    score = Math.round(
                      scores.questionnaires +
                      scores.attendance +
                      scores.participation +
                      scores.finalExam +
                      (scores.customScores?.reduce((sum: number, cs: any) => sum + cs.score, 0) || 0)
                    );

                    // Calculate absent times from attendance records
                    absentTimes = evaluation.attendanceRecords?.filter(
                      record => !record.isPresent
                    ).length || 0;
                  }
                } catch (error) {
                  console.error(`Error getting evaluation for student ${student.id}:`, error);
                }

                return {
                  phone: WhatsappService.formatPhoneNumber(student.phone),
                  firstName: student.firstName || ' ',
                  lastName: student.lastName || ' ',
                  fullName: `${student.firstName || ''} ${student.lastName || ''}`.trim() || ' ',
                  score: score,
                  absentTimes: absentTimes,
                  // Classroom properties - use space if invalid
                  teacherName: teacherName,
                  subject: classroom.subject || ' ',
                  schedule: schedule,
                  materialPrice: classroom.materialPrice ?? ' ',
                  classroom: classroom.location || ' '
                };
              })
            );

            const response = await WhatsappService.sendMessage(
              studentContacts,
              message,
              messageDelay
            );

            if (response.success) {
              progress[i].status = 'sent';
              successCount++;
            } else {
              progress[i].status = 'failed';
              progress[i].error = response.error || 'Error desconocido';
              failCount++;
            }
          } else {
            // Send to group directly - include classroom properties
            const teacher = teachers.get(classroom.teacherId);
            const teacherName = teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || ' ' : ' ';
            const schedule = classroom.schedule 
              ? `${classroom.schedule.dayOfWeek || ''} a las ${classroom.schedule.time || ''} (${classroom.schedule.duration || ''} min)`.trim() || ' '
              : ' ';

            const groupContact = {
              phone: classroom.whatsappGroup.id,
              id: `${classroom.whatsappGroup.id}`,
              title: classroom.whatsappGroup.name || `${classroom.subject} - ${classroom.name}`,
              // Classroom properties - use space if invalid
              teacherName: teacherName,
              subject: classroom.subject || ' ',
              schedule: schedule,
              materialPrice: classroom.materialPrice ?? ' ',
              classroom: classroom.location || ' '
            };

            const response = await WhatsappService.sendMessage(
              [groupContact],
              message,
              messageDelay,
              "",
              true
            );

            if (response.success) {
              progress[i].status = 'sent';
              successCount++;
            } else {
              progress[i].status = 'failed';
              progress[i].error = response.error || 'Error desconocido';
              failCount++;
            }
          }
        } catch (error: any) {
          progress[i].status = 'failed';
          progress[i].error = error.message || 'Error al enviar';
          failCount++;
        }

        // Update progress
        setSendingProgress([...progress]);
        setCurrentProgress(((i + 1) / progress.length) * 100);

        // Add delay between messages
        if (i < progress.length - 1) {
          await new Promise(resolve => setTimeout(resolve, messageDelay * 1000));
        }
      }

      // Show summary
      if (failCount === 0) {
        toast.success(`✅ Mensajes enviados exitosamente a ${successCount} grupos`);
      } else if (successCount === 0) {
        toast.error(`❌ Error al enviar mensajes. ${failCount} grupos fallaron`);
      } else {
        toast.warning(`⚠️ Enviado: ${successCount} | Fallidos: ${failCount}`);
      }

      // Reset form
      setMessageContent('');
      setMessageCaption('');
      setMessageFile(null);
      setSelectedClassrooms(new Set());
      setSelectAll(false);
    } catch (error: any) {
      console.error('Error sending bulk messages:', error);
      toast.error('Error al enviar mensajes masivos');
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: SendingProgress['status']) => {
    switch (status) {
      case 'pending':
        return <i className="bi bi-clock text-muted"></i>;
      case 'sending':
        return <Spinner size="sm" color="primary" />;
      case 'sent':
        return <i className="bi bi-check-circle-fill text-success"></i>;
      case 'failed':
        return <i className="bi bi-x-circle-fill text-danger"></i>;
    }
  };

  const totalRecipients = Array.from(selectedClassrooms).reduce((sum, id) => {
    const classroom = classrooms.find(c => c.id === id);
    const sendIndividual = sendToIndividuals.get(id) || false;
    
    if (sendIndividual) {
      // Count individual students (excluding those that are excluded)
      const students = classroomStudents.get(id);
      if (students) {
        const excludedCount = excludedStudents.get(id)?.size || 0;
        return sum + (students.length - excludedCount);
      }
      // Fallback to classroom studentIds if students not loaded yet
      return sum + (classroom?.studentIds?.length || 0);
    } else {
      // Count as 1 group
      return sum + 1;
    }
  }, 0);

  const totalGroups = Array.from(selectedClassrooms).filter(id => !sendToIndividuals.get(id)).length;
  const totalIndividuals = Array.from(selectedClassrooms).reduce((sum, id) => {
    const sendIndividual = sendToIndividuals.get(id);
    if (sendIndividual) {
      const students = classroomStudents.get(id);
      if (students) {
        const excludedCount = excludedStudents.get(id)?.size || 0;
        return sum + (students.length - excludedCount);
      }
      // Fallback to classroom studentIds if students not loaded yet
      const classroom = classrooms.find(c => c.id === id);
      return sum + (classroom?.studentIds?.length || 0);
    }
    return sum;
  }, 0);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner size="lg" color="success" />
        <p className="mt-3">Cargando clases...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-3 px-2 px-sm-3">
      {/* Custom Styles */}
      <style>{`
        .hover-bg-light:hover {
          background-color: #f8f9fa !important;
        }
      `}</style>
      
      {/* Header */}
      <Row className="mb-3">
        <Col>
          <Button
            color="link"
            className="p-0 mb-2 text-decoration-none"
            onClick={() => navigate('/admin/whatsapp')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </Button>
          
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h4 className="mb-1">
                <i className="bi bi-send me-2"></i>
                Mensajería Masiva
              </h4>
              <p className="text-muted mb-0 small">
                Envía mensajes a múltiples grupos de WhatsApp
              </p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Warning Alert */}
      {classrooms.length === 0 && (
        <Alert color="warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          No hay clases con grupos de WhatsApp activos. 
          <Button 
            color="link" 
            className="p-0 ms-2"
            onClick={() => navigate('/admin/whatsapp/groups')}
          >
            Crear grupos
          </Button>
        </Alert>
      )}

      <Row>
        {/* Left Column - Classroom Selection */}
        <Col lg={7} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardHeader className="bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <i className="bi bi-list-check me-2"></i>
                Seleccionar Clases
              </h6>
              <Badge color="primary" pill>
                {selectedClassrooms.size} / {classrooms.length}
              </Badge>
            </CardHeader>
            <CardBody>
              {/* Search */}
              <InputGroup size="sm" className="mb-3">
                <InputGroupText>
                  <i className="bi bi-search"></i>
                </InputGroupText>
                <Input
                  type="text"
                  placeholder="Buscar clases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              {/* Select All */}
              <div className="mb-3">
                <div className="d-flex gap-2">
                  <Input
                    type="checkbox"
                    id="select-all"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                  <Label check htmlFor="select-all" className="fw-bold">
                    Seleccionar Todas ({filteredClassrooms.length})
                  </Label>
                </div>
              </div>

              {/* Classroom List */}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {filteredClassrooms.length === 0 ? (
                  <Alert color="info" className="mb-0">
                    No se encontraron clases
                  </Alert>
                ) : (
                  filteredClassrooms.map(classroom => (
                    <div 
                      key={classroom.id}
                      className="border rounded mb-2"
                      style={{ 
                        backgroundColor: selectedClassrooms.has(classroom.id) ? '#f0f9ff' : 'white'
                      }}
                    >
                      <div 
                        className="form-check p-2 d-flex gap-2"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSelectClassroom(classroom.id)}
                      >
                        <Input
                          type="checkbox"
                          id={`classroom-${classroom.id}`}
                          checked={selectedClassrooms.has(classroom.id)}
                          onChange={() => handleSelectClassroom(classroom.id)}
                        />
                        
                        <Label 
                          check 
                          htmlFor={`classroom-${classroom.id}`}
                          className="w-100"
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="fw-bold">{classroom.subject}</div>
                              <small className="text-muted d-block">
                                {classroom.name}
                              </small>
                              <small className="text-muted">
                                <i className="bi bi-people me-1"></i>
                                {classroom.studentIds?.length || 0} estudiantes
                              </small>
                            </div>
                            <Badge color="success" className="ms-2">
                              <i className="bi bi-whatsapp"></i>
                            </Badge>
                          </div>
                        </Label>
                      </div>
                      
                      {/* Individual/Group Send Switch */}
                      {selectedClassrooms.has(classroom.id) && (
                        <div 
                          className="px-2 pb-2 pt-0 border-top"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            <small className="text-muted">
                              <i className={`bi ${sendToIndividuals.get(classroom.id) ? 'bi-person-fill' : 'bi-people-fill'} me-1`}></i>
                              {sendToIndividuals.get(classroom.id) ? 'Enviar individual' : 'Enviar a grupo'}
                            </small>
                            <div className="form-check form-switch mb-0">
                              <Input
                                type="switch"
                                id={`switch-${classroom.id}`}
                                checked={sendToIndividuals.get(classroom.id) || false}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleToggleIndividualSending(classroom.id, e.target.checked);
                                }}
                              />
                              <Label 
                                check 
                                htmlFor={`switch-${classroom.id}`}
                                className="small"
                                style={{ cursor: 'pointer' }}
                              >
                                Individual
                              </Label>
                            </div>
                          </div>
                          
                          {/* Student Selection Accordion - Only show when individual sending is enabled */}
                          {sendToIndividuals.get(classroom.id) && classroomStudents.has(classroom.id) && (
                            <div className="mt-2">
                              <div
                                className="d-flex align-items-center justify-content-between p-2 bg-light rounded"
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleAccordion(classroom.id)}
                              >
                                <small className="fw-bold text-primary">
                                  <i className={`bi ${openAccordions.has(classroom.id) ? 'bi-chevron-down' : 'bi-chevron-right'} me-1`}></i>
                                  Seleccionar Estudiantes
                                </small>
                                <Badge color="primary" pill>
                                  {classroomStudents.get(classroom.id)!.length - (excludedStudents.get(classroom.id)?.size || 0)} / {classroomStudents.get(classroom.id)!.length}
                                </Badge>
                              </div>
                              
                              {/* Accordion Content */}
                              {openAccordions.has(classroom.id) && (
                                <div className="border rounded mt-2 p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                  {classroomStudents.get(classroom.id)!.map(student => {
                                    const isExcluded = excludedStudents.get(classroom.id)?.has(student.id) || false;
                                    return (
                                      <div
                                        key={student.id}
                                        className="form-check mb-1 p-1 rounded hover-bg-light d-flex gap-2"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => toggleStudentExclusion(classroom.id, student.id)}
                                      >
                                        <Input
                                          type="checkbox"
                                          id={`student-${classroom.id}-${student.id}`}
                                          checked={!isExcluded}
                                          onChange={() => toggleStudentExclusion(classroom.id, student.id)}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <Label
                                          check
                                          htmlFor={`student-${classroom.id}-${student.id}`}
                                          className="w-100 mb-0"
                                          style={{ cursor: 'pointer' }}
                                        >
                                          <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                              <small className="fw-bold d-block">
                                                {student.firstName} {student.lastName}
                                              </small>
                                              <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                <i className="bi bi-telephone me-1"></i>
                                                {student.phone}
                                              </small>
                                            </div>
                                            {isExcluded && (
                                              <Badge color="danger" pill className="ms-2">
                                                Excluido
                                              </Badge>
                                            )}
                                          </div>
                                        </Label>
                                      </div>
                                    );
                                  })}
                                  
                                  {classroomStudents.get(classroom.id)!.length === 0 && (
                                    <small className="text-muted d-block text-center py-2">
                                      No hay estudiantes con teléfonos válidos
                                    </small>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </Col>

        {/* Right Column - Message Composition */}
        <Col lg={5} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <CardHeader className="bg-white">
              <h6 className="mb-0">
                <i className="bi bi-pencil-square me-2"></i>
                Componer Mensaje
              </h6>
            </CardHeader>
            <CardBody>
              <Form>
                {/* Available Properties Info */}
                <Alert color="info" className="mb-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <small className="fw-bold">
                      <i className="bi bi-magic me-1"></i>
                      Variables disponibles:
                    </small>
                  </div>
                  <div className="mt-2" style={{ fontSize: '0.75rem' }}>
                    {/* Student properties - only shown if any classroom has individual sending enabled */}
                    {Array.from(selectedClassrooms).some(id => sendToIndividuals.get(id)) && (
                      <div className="mb-2">
                        <div className="fw-bold mb-1">
                          <i className="bi bi-person-badge me-1"></i>
                          Del Estudiante (solo envío individual):
                        </div>
                        <div className="d-flex flex-wrap gap-1">
                          <Badge color="primary" className="font-monospace">@firstName</Badge>
                          <Badge color="primary" className="font-monospace">@lastName</Badge>
                          <Badge color="primary" className="font-monospace">@fullName</Badge>
                          <Badge color="primary" className="font-monospace">@score</Badge>
                          <Badge color="primary" className="font-monospace">@absentTimes</Badge>
                        </div>
                      </div>
                    )}
                    
                    {/* Classroom properties - always available */}
                    <div>
                      <div className="fw-bold mb-1">
                        <i className="bi bi-book me-1"></i>
                        De la Clase:
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        <Badge color="success" className="font-monospace">@teacherName</Badge>
                        <Badge color="success" className="font-monospace">@subject</Badge>
                        <Badge color="success" className="font-monospace">@schedule</Badge>
                        <Badge color="success" className="font-monospace">@materialPrice</Badge>
                        <Badge color="success" className="font-monospace">@classroom</Badge>
                      </div>
                    </div>
                    
                    <small className="text-muted d-block mt-2">
                      💡 Usa estas variables en tu mensaje para personalizarlo automáticamente
                    </small>
                  </div>
                </Alert>

                {/* Message Type */}
                <FormGroup>
                  <Label>Tipo de Mensaje</Label>
                  <div>
                    <div className="form-check form-check-inline">
                      <Input
                        type="radio"
                        id="type-text"
                        name="messageType"
                        checked={messageType === 'text'}
                        onChange={() => setMessageType('text')}
                      />
                      <Label check htmlFor="type-text">
                        <i className="bi bi-chat-text me-1"></i>
                        Texto
                      </Label>
                    </div>
                    <div className="form-check form-check-inline">
                      <Input
                        type="radio"
                        id="type-image"
                        name="messageType"
                        checked={messageType === 'image'}
                        onChange={() => setMessageType('image')}
                      />
                      <Label check htmlFor="type-image">
                        <i className="bi bi-image me-1"></i>
                        Imagen
                      </Label>
                    </div>
                  </div>
                </FormGroup>

                {/* Text Message */}
                {messageType === 'text' && (
                  <FormGroup>
                    <Label for="message-content">Mensaje *</Label>
                    <Input
                      type="textarea"
                      id="message-content"
                      rows={6}
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Escribe tu mensaje aquí..."
                      maxLength={1000}
                    />
                    <small className="text-muted">
                      {messageContent.length}/1000 caracteres
                    </small>
                  </FormGroup>
                )}

                {/* Image Message */}
                {messageType === 'image' && (
                  <>
                    <FormGroup>
                      <Label for="message-file">Imagen *</Label>
                      <Input
                        type="file"
                        id="message-file"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      {messageFile && (
                        <small className="text-success d-block mt-1">
                          <i className="bi bi-check-circle me-1"></i>
                          {messageFile.name} ({(messageFile.size / 1024).toFixed(1)} KB)
                        </small>
                      )}
                    </FormGroup>
                    <FormGroup>
                      <Label for="message-caption">Leyenda (opcional)</Label>
                      <Input
                        type="textarea"
                        id="message-caption"
                        rows={3}
                        value={messageCaption}
                        onChange={(e) => setMessageCaption(e.target.value)}
                        placeholder="Agrega una leyenda a tu imagen..."
                        maxLength={500}
                      />
                      <small className="text-muted">
                        {messageCaption.length}/500 caracteres
                      </small>
                    </FormGroup>
                  </>
                )}

                {/* Delay */}
                <FormGroup>
                  <Label for="message-delay">
                    Retraso entre mensajes (segundos)
                  </Label>
                  <Input
                    type="number"
                    id="message-delay"
                    value={messageDelay}
                    onChange={(e) => setMessageDelay(parseInt(e.target.value) || 5)}
                    min={1}
                    max={60}
                  />
                  <small className="text-muted">
                    Tiempo de espera entre el envío de cada mensaje
                  </small>
                </FormGroup>

                {/* Summary */}
                {selectedClassrooms.size > 0 && (
                  <Alert color="info" className="mb-3">
                    <div className="fw-bold mb-2">Resumen:</div>
                    <div className="small">
                      <div>
                        <i className="bi bi-inbox-fill me-2"></i>
                        {selectedClassrooms.size} clases seleccionadas
                      </div>
                      {totalGroups > 0 && (
                        <div>
                          <i className="bi bi-people-fill me-2"></i>
                          {totalGroups} envíos a grupos
                        </div>
                      )}
                      {totalIndividuals > 0 && (
                        <div>
                          <i className="bi bi-person-fill me-2"></i>
                          {totalIndividuals} envíos individuales
                        </div>
                      )}
                      <div>
                        <i className="bi bi-send-fill me-2"></i>
                        {totalRecipients} mensajes totales
                      </div>
                      <div>
                        <i className="bi bi-clock-fill me-2"></i>
                        Tiempo estimado: ~{(totalRecipients * messageDelay / 60).toFixed(1)} minutos
                      </div>
                    </div>
                  </Alert>
                )}

                {/* Send Button */}
                <div className="d-grid">
                  <Button
                    color="success"
                    size="lg"
                    onClick={handleSendMessages}
                    disabled={sending || selectedClassrooms.size === 0}
                  >
                    {sending ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill me-2"></i>
                        Enviar a {selectedClassrooms.size} Grupos
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Progress Modal */}
      <Modal 
        isOpen={progressModal} 
        toggle={() => !sending && setProgressModal(false)}
        size="lg"
        centered
      >
        <ModalHeader toggle={() => !sending && setProgressModal(false)}>
          Enviando Mensajes
        </ModalHeader>
        <ModalBody>
          <div className="mb-3">
            <div className="d-flex justify-content-between mb-2">
              <small className="text-muted">Progreso General</small>
              <small className="text-muted fw-bold">
                {sendingProgress.filter(p => p.status === 'sent').length} / {sendingProgress.length}
              </small>
            </div>
            <Progress 
              value={currentProgress} 
              className="mb-2"
              color="success"
              animated={sending}
            />
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table size="sm" hover>
              <thead className="table-light sticky-top">
                <tr>
                  <th style={{ width: '50px' }}></th>
                  <th>Clase</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {sendingProgress.map((item, index) => (
                  <tr key={item.classroomId}>
                    <td className="text-center">
                      {getStatusIcon(item.status)}
                    </td>
                    <td>
                      <div className="small">{item.classroomName}</div>
                    </td>
                    <td>
                      {item.status === 'sent' && (
                        <Badge color="success">Enviado</Badge>
                      )}
                      {item.status === 'sending' && (
                        <Badge color="primary">Enviando...</Badge>
                      )}
                      {item.status === 'failed' && (
                        <div>
                          <Badge color="danger">Error</Badge>
                          {item.error && (
                            <small className="d-block text-danger mt-1">
                              {item.error}
                            </small>
                          )}
                        </div>
                      )}
                      {item.status === 'pending' && (
                        <Badge color="secondary">Pendiente</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            color="secondary" 
            onClick={() => setProgressModal(false)}
            disabled={sending}
          >
            {sending ? 'Enviando...' : 'Cerrar'}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default BulkMessaging;

