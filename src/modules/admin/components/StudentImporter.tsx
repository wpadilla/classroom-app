// StudentImporter Component
// Bulk import students from Excel files with deduplication by phone

import React, { useState, useRef, useCallback } from 'react';
import {
  Button,
  Card,
  CardBody,
  Progress,
  Alert,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Row,
  Col,
  Input,
  Label,
  FormGroup,
  Badge,
  Spinner,
} from 'reactstrap';
import * as XLSX from 'xlsx';
import { UserService } from '../../../services/user/user.service';
import { ClassroomService } from '../../../services/classroom/classroom.service';
import { IClassroom } from '../../../models';
import { toast } from 'react-toastify';

// Column mapping options
interface ColumnMapping {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  classroomName?: string;
}

// Parsed student row
interface ParsedStudent {
  rowNumber: number;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  classroomName: string;
  matchedClassroomId: string | null;
  matchedClassroomName: string | null;
  status: 'pending' | 'success' | 'error' | 'skipped' | 'duplicate';
  message?: string;
  existingUserId?: string;
}

// Import result
interface ImportResult {
  total: number;
  created: number;
  enrolled: number;
  duplicates: number;
  errors: number;
  skipped: number;
}

interface StudentImporterProps {
  isOpen: boolean;
  toggle: () => void;
  onImportComplete?: () => void;
}

const StudentImporter: React.FC<StudentImporterProps> = ({
  isOpen,
  toggle,
  onImportComplete,
}) => {
  // File state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [rawData, setRawData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  // Column mapping state
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    fullName: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    classroomName: '',
  });

  // Parsed data state
  const [students, setStudents] = useState<ParsedStudent[]>([]);
  const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
  const [existingPhones, setExistingPhones] = useState<Map<string, string>>(new Map());

  // UI state
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Reset everything
  const resetImporter = useCallback(() => {
    setFileName('');
    setRawData([]);
    setHeaders([]);
    setColumnMapping({
      fullName: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      classroomName: '',
    });
    setStudents([]);
    setStep('upload');
    setLoading(false);
    setImporting(false);
    setProgress(0);
    setLogs([]);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv',
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Por favor seleccione un archivo Excel (.xlsx, .xls) o CSV');
      return;
    }

    setLoading(true);
    setFileName(file.name);

    try {
      // Read file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Convert to JSON (with headers)
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      if (jsonData.length < 2) {
        toast.error('El archivo no contiene datos suficientes');
        setLoading(false);
        return;
      }

      // Extract headers (first row)
      const headerRow = jsonData[0].map((h: any) => String(h || '').trim());
      setHeaders(headerRow);

      // Extract data rows
      const dataRows = jsonData.slice(1).filter(row => 
        row.some(cell => cell !== null && cell !== undefined && cell !== '')
      );
      setRawData(dataRows);

      // Auto-detect column mapping
      const autoMapping: ColumnMapping = { phone: '' };
      headerRow.forEach((header, index) => {
        const h = header.toLowerCase();
        if (h.includes('nombre completo') || h.includes('full name')) {
          autoMapping.fullName = header;
        } else if (h.includes('nombre') || h.includes('first')) {
          if (!autoMapping.firstName) autoMapping.firstName = header;
        } else if (h.includes('apellido') || h.includes('last')) {
          autoMapping.lastName = header;
        } else if (h.includes('telefono') || h.includes('teléfono') || h.includes('celular') || h.includes('phone') || h.includes('whatsapp')) {
          autoMapping.phone = header;
        } else if (h.includes('email') || h.includes('correo')) {
          autoMapping.email = header;
        } else if (h.includes('clase') || h.includes('nivel') || h.includes('formación') || h.includes('classroom')) {
          autoMapping.classroomName = header;
        }
      });

      setColumnMapping(autoMapping);

      // Load existing data
      const [allClassrooms, allUsers] = await Promise.all([
        ClassroomService.getAllClassrooms(),
        UserService.getAllUsers(),
      ]);

      setClassrooms(allClassrooms);
      
      // Build existing phones map (phone -> userId)
      const phoneMap = new Map<string, string>();
      allUsers.forEach(user => {
        const cleanPhone = cleanPhoneNumber(user.phone);
        if (cleanPhone) {
          phoneMap.set(cleanPhone, user.id);
        }
      });
      setExistingPhones(phoneMap);

      setStep('mapping');
      toast.success(`Archivo cargado: ${dataRows.length} filas encontradas`);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Error al leer el archivo');
    } finally {
      setLoading(false);
    }
  };

  // Clean phone number (remove non-digits)
  const cleanPhoneNumber = (phone: string): string => {
    return String(phone || '').replace(/\D/g, '');
  };

  // Find matching classroom by name
  const findMatchingClassroom = useCallback((name: string): { id: string; name: string } | null => {
    if (!name) return null;
    
    const normalize = (s: string) => 
      s.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const target = normalize(name);

    // Try exact match first
    let match = classrooms.find(c => normalize(c.name) === target);
    
    // Try partial match
    if (!match) {
      match = classrooms.find(c => {
        const source = normalize(c.name);
        return source.includes(target) || target.includes(source);
      });
    }

    return match ? { id: match.id, name: match.name } : null;
  }, [classrooms]);

  // Process data with column mapping
  const processMapping = useCallback(() => {
    if (!columnMapping.phone) {
      toast.error('Debe mapear la columna de teléfono');
      return;
    }

    const parsed: ParsedStudent[] = [];

    rawData.forEach((row, index) => {
      // Get header indices
      const getColValue = (colName: string | undefined): string => {
        if (!colName) return '';
        const colIndex = headers.indexOf(colName);
        return colIndex >= 0 ? String(row[colIndex] || '').trim() : '';
      };

      const phone = cleanPhoneNumber(getColValue(columnMapping.phone));
      const fullName = getColValue(columnMapping.fullName);
      const firstName = getColValue(columnMapping.firstName);
      const lastName = getColValue(columnMapping.lastName);
      const email = getColValue(columnMapping.email);
      const classroomName = getColValue(columnMapping.classroomName);

      // Skip rows without phone
      if (!phone || phone.length < 10) {
        return;
      }

      // Parse name
      let parsedFirstName = firstName;
      let parsedLastName = lastName;

      if (!parsedFirstName && fullName) {
        const nameParts = fullName.split(' ').filter(p => p.trim());
        if (nameParts.length >= 4) {
          parsedFirstName = `${nameParts[0]} ${nameParts[1]}`;
          parsedLastName = nameParts.slice(2).join(' ');
        } else if (nameParts.length === 3) {
          parsedFirstName = nameParts[0];
          parsedLastName = `${nameParts[1]} ${nameParts[2]}`;
        } else if (nameParts.length === 2) {
          parsedFirstName = nameParts[0];
          parsedLastName = nameParts[1];
        } else {
          parsedFirstName = fullName;
          parsedLastName = '';
        }
      }

      // Check for duplicate in current batch
      const existsInBatch = parsed.some(s => cleanPhoneNumber(s.phone) === phone);

      // Check for existing user
      const existingUserId = existingPhones.get(phone);

      // Find matching classroom
      const classroomMatch = findMatchingClassroom(classroomName);

      const student: ParsedStudent = {
        rowNumber: index + 2, // +2 for 1-indexed and header row
        fullName: fullName || `${parsedFirstName} ${parsedLastName}`.trim(),
        firstName: parsedFirstName,
        lastName: parsedLastName,
        phone,
        email,
        classroomName,
        matchedClassroomId: classroomMatch?.id || null,
        matchedClassroomName: classroomMatch?.name || null,
        status: existsInBatch ? 'duplicate' : (existingUserId ? 'skipped' : 'pending'),
        message: existsInBatch 
          ? 'Duplicado en el archivo' 
          : (existingUserId ? 'Usuario ya existe' : undefined),
        existingUserId,
      };
      Object.keys(student).forEach(key => {
        if(!student[key as keyof ParsedStudent] && !['false', '0'].includes(JSON.stringify(student[key as keyof ParsedStudent]))) { 
          delete student[key as keyof ParsedStudent];
        }
       }); // For debugging if needed
      parsed.push(student);
    });

    console.log('Parsed students:', parsed);

    setStudents(parsed);
    setStep('preview');
    
    const duplicates = parsed.filter(s => s.status === 'duplicate' || s.existingUserId).length;
    const pending = parsed.filter(s => s.status === 'pending').length;
    
    toast.info(`${pending} estudiantes nuevos, ${duplicates} existentes/duplicados`);
  }, [rawData, headers, columnMapping, existingPhones, findMatchingClassroom]);

  // Start import process
  const startImport = async () => {
    setImporting(true);
    setStep('importing');
    setProgress(0);
    setLogs([]);

    const importResult: ImportResult = {
      total: students.length,
      created: 0,
      enrolled: 0,
      duplicates: 0,
      errors: 0,
      skipped: 0,
    };

    const updatedStudents = [...students];

    for (let i = 0; i < updatedStudents.length; i++) {
      const student = updatedStudents[i];

      try {
        // Handle existing users
        if (student.existingUserId) {
          // Just enroll in classroom if specified
          if (student.matchedClassroomId) {
            try {
              await ClassroomService.addStudentToClassroom(
                student.matchedClassroomId,
                student.existingUserId
              );
              student.status = 'success';
              student.message = 'Inscrito en clase (usuario existente)';
              importResult.enrolled++;
              setLogs(prev => [...prev, `📚 ${student.fullName}: Inscrito en ${student.matchedClassroomName}`]);
            } catch (enrollError: any) {
              // Already enrolled is not an error
              if (enrollError.message?.includes('already enrolled')) {
                student.status = 'skipped';
                student.message = 'Ya inscrito en esta clase';
                importResult.skipped++;
              } else {
                throw enrollError;
              }
            }
          } else {
            student.status = 'skipped';
            student.message = 'Usuario existente, sin clase para inscribir';
            importResult.duplicates++;
          }
          setLogs(prev => [...prev, `ℹ️ ${student.fullName}: Usuario existente`]);
        } else if (student.status !== 'duplicate') {
          // Create new user
          const newUserData: any = {
            firstName: student.firstName || 'Sin nombre',
            lastName: student.lastName || '',
            email: student.email || undefined,
            phone: student.phone,
            password: student.phone, // Phone as default password
            role: 'student',
            isTeacher: false,
            isActive: true,
            enrolledClassrooms: [],
            completedClassrooms: [],
            teachingClassrooms: [],
            taughtClassrooms: [],
          };

          const newUserId = await UserService.createUser(newUserData);
          importResult.created++;
          setLogs(prev => [...prev, `✅ ${student.fullName}: Usuario creado`]);

          // Enroll in classroom if matched
          if (student.matchedClassroomId && newUserId) {
            try {
              await ClassroomService.addStudentToClassroom(
                student.matchedClassroomId,
                newUserId
              );
              importResult.enrolled++;
              setLogs(prev => [...prev, `📚 ${student.fullName}: Inscrito en ${student.matchedClassroomName}`]);
            } catch (enrollError) {
              console.error('Error enrolling:', enrollError);
              setLogs(prev => [...prev, `⚠️ ${student.fullName}: Error al inscribir`]);
            }
          }

          student.status = 'success';
          student.message = 'Usuario creado exitosamente';
        } else {
          importResult.duplicates++;
        }
      } catch (error: any) {
        console.error('Import error:', error);
        student.status = 'error';
        student.message = error.message || 'Error desconocido';
        importResult.errors++;
        setLogs(prev => [...prev, `❌ ${student.fullName}: ${error.message}`]);
      }

      // Update progress
      setProgress(Math.round(((i + 1) / updatedStudents.length) * 100));
      setStudents([...updatedStudents]);
    }

    setResult(importResult);
    setImporting(false);
    setStep('complete');
    toast.success(`Importación completada: ${importResult.created} creados, ${importResult.enrolled} inscripciones`);
    
    if (onImportComplete) {
      onImportComplete();
    }
  };

  // Render column mapping selector
  const renderColumnSelector = (label: string, field: keyof ColumnMapping, required: boolean = false) => (
    <FormGroup>
      <Label>{label} {required && <span className="text-danger">*</span>}</Label>
      <Input
        type="select"
        value={columnMapping[field] || ''}
        onChange={(e) => setColumnMapping(prev => ({ ...prev, [field]: e.target.value }))}
      >
        <option value="">-- No mapear --</option>
        {headers.map(header => (
          <option key={header} value={header}>{header}</option>
        ))}
      </Input>
    </FormGroup>
  );

  // Get status badge
  const getStatusBadge = (status: ParsedStudent['status']) => {
    switch (status) {
      case 'success': return <Badge color="success">Éxito</Badge>;
      case 'error': return <Badge color="danger">Error</Badge>;
      case 'skipped': return <Badge color="warning">Existente</Badge>;
      case 'duplicate': return <Badge color="secondary">Duplicado</Badge>;
      default: return <Badge color="info">Pendiente</Badge>;
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="xl" backdrop="static">
      <ModalHeader toggle={step !== 'importing' ? toggle : undefined}>
        <i className="bi bi-file-earmark-spreadsheet me-2"></i>
        Importar Estudiantes desde Excel
      </ModalHeader>
      <ModalBody>
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="text-center py-5">
            <i className="bi bi-cloud-upload display-1 text-primary mb-4"></i>
            <h5>Seleccione un archivo Excel</h5>
            <p className="text-muted mb-4">
              Formatos soportados: .xlsx, .xls, .csv
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            <Button
              color="primary"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <i className="bi bi-folder2-open me-2"></i>
                  Seleccionar Archivo
                </>
              )}
            </Button>

            <Alert color="info" className="mt-4 text-start">
              <strong>Columnas esperadas:</strong>
              <ul className="mb-0 mt-2">
                <li><strong>Teléfono</strong> (requerido): Número de teléfono del estudiante</li>
                <li><strong>Nombre / Nombre Completo</strong>: Nombre del estudiante</li>
                <li><strong>Email</strong> (opcional): Correo electrónico</li>
                <li><strong>Clase / Nivel</strong> (opcional): Nombre de la clase para inscribir</li>
              </ul>
            </Alert>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'mapping' && (
          <>
            <Alert color="info">
              <strong>Archivo:</strong> {fileName} ({rawData.length} filas)
              <br />
              <span>Configure el mapeo de columnas y luego haga clic en "Procesar Datos"</span>
            </Alert>

            <Card className="mb-3">
              <CardBody>
                <h6 className="mb-3">Mapeo de Columnas</h6>
                <Row>
                  <Col md={6}>
                    {renderColumnSelector('Teléfono / WhatsApp', 'phone', true)}
                  </Col>
                  <Col md={6}>
                    {renderColumnSelector('Nombre Completo', 'fullName')}
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    {renderColumnSelector('Nombre(s)', 'firstName')}
                  </Col>
                  <Col md={6}>
                    {renderColumnSelector('Apellido(s)', 'lastName')}
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    {renderColumnSelector('Correo Electrónico', 'email')}
                  </Col>
                  <Col md={6}>
                    {renderColumnSelector('Clase / Nivel de Formación', 'classroomName')}
                  </Col>
                </Row>
              </CardBody>
            </Card>

            <h6>Vista previa de datos (primeras 5 filas)</h6>
            <div style={{ overflowX: 'auto' }}>
              <Table size="sm" bordered>
                <thead>
                  <tr>
                    {headers.map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rawData.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {headers.map((_, j) => (
                        <td key={j}>{row[j] ?? ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <>
            <Alert color="info">
              <Row>
                <Col md={3}>
                  <strong>Total:</strong> {students.length}
                </Col>
                <Col md={3}>
                  <strong>Nuevos:</strong> {students.filter(s => s.status === 'pending').length}
                </Col>
                <Col md={3}>
                  <strong>Existentes:</strong> {students.filter(s => s.existingUserId).length}
                </Col>
                <Col md={3}>
                  <strong>Duplicados:</strong> {students.filter(s => s.status === 'duplicate').length}
                </Col>
              </Row>
            </Alert>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Table size="sm" bordered striped hover>
                <thead className="sticky-top bg-white">
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Clase Detectada</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => (
                    <tr
                      key={idx}
                      className={
                        s.status === 'duplicate' ? 'table-secondary' :
                        s.existingUserId ? 'table-warning' : ''
                      }
                    >
                      <td>{s.rowNumber}</td>
                      <td>
                        {s.fullName}
                        {!s.firstName && <Badge color="warning" className="ms-1">Sin nombre</Badge>}
                      </td>
                      <td>{s.phone}</td>
                      <td>{s.email || '-'}</td>
                      <td>
                        {s.matchedClassroomName ? (
                          <Badge color="success">{s.matchedClassroomName}</Badge>
                        ) : s.classroomName ? (
                          <span className="text-danger">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            {s.classroomName}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {s.existingUserId ? (
                          <Badge color="warning">Usuario existe</Badge>
                        ) : s.status === 'duplicate' ? (
                          <Badge color="secondary">Duplicado</Badge>
                        ) : (
                          <Badge color="primary">Nuevo</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}

        {/* Step 4: Importing */}
        {step === 'importing' && (
          <>
            <div className="text-center mb-4">
              <Spinner color="primary" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
              <h5>Importando estudiantes...</h5>
              <p className="text-muted">Por favor no cierre esta ventana</p>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between mb-1">
                <span>Progreso</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} animated />
            </div>

            <div className="bg-dark text-light p-3 rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <code>
                {logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </code>
            </div>
          </>
        )}

        {/* Step 5: Complete */}
        {step === 'complete' && result && (
          <>
            <div className="text-center mb-4">
              <i className="bi bi-check-circle display-1 text-success"></i>
              <h4 className="mt-3">Importación Completada</h4>
            </div>

            <Row className="text-center mb-4">
              <Col>
                <Card className="bg-success text-white">
                  <CardBody>
                    <h3 className="mb-0">{result.created}</h3>
                    <small>Usuarios Creados</small>
                  </CardBody>
                </Card>
              </Col>
              <Col>
                <Card className="bg-primary text-white">
                  <CardBody>
                    <h3 className="mb-0">{result.enrolled}</h3>
                    <small>Inscripciones</small>
                  </CardBody>
                </Card>
              </Col>
              <Col>
                <Card className="bg-warning">
                  <CardBody>
                    <h3 className="mb-0">{result.duplicates + result.skipped}</h3>
                    <small>Existentes/Omitidos</small>
                  </CardBody>
                </Card>
              </Col>
              <Col>
                <Card className="bg-danger text-white">
                  <CardBody>
                    <h3 className="mb-0">{result.errors}</h3>
                    <small>Errores</small>
                  </CardBody>
                </Card>
              </Col>
            </Row>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <Table size="sm" bordered striped>
                <thead className="sticky-top bg-white">
                  <tr>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Estado</th>
                    <th>Mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => (
                    <tr key={idx}>
                      <td>{s.fullName}</td>
                      <td>{s.phone}</td>
                      <td>{getStatusBadge(s.status)}</td>
                      <td><small>{s.message || '-'}</small></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        {step === 'upload' && (
          <Button color="secondary" onClick={toggle}>
            Cancelar
          </Button>
        )}
        
        {step === 'mapping' && (
          <>
            <Button color="secondary" onClick={resetImporter}>
              <i className="bi bi-arrow-left me-1"></i>
              Volver
            </Button>
            <Button color="primary" onClick={processMapping} disabled={!columnMapping.phone}>
              Procesar Datos
              <i className="bi bi-arrow-right ms-1"></i>
            </Button>
          </>
        )}

        {step === 'preview' && (
          <>
            <Button color="secondary" onClick={() => setStep('mapping')}>
              <i className="bi bi-arrow-left me-1"></i>
              Volver al Mapeo
            </Button>
            <Button
              color="success"
              onClick={startImport}
              disabled={students.filter(s => s.status === 'pending').length === 0}
            >
              <i className="bi bi-play-fill me-1"></i>
              Iniciar Importación ({students.filter(s => s.status === 'pending' || s.existingUserId).length} estudiantes)
            </Button>
          </>
        )}

        {step === 'importing' && (
          <Button color="secondary" disabled>
            Importando...
          </Button>
        )}

        {step === 'complete' && (
          <>
            <Button color="secondary" onClick={resetImporter}>
              <i className="bi bi-arrow-repeat me-1"></i>
              Nueva Importación
            </Button>
            <Button color="primary" onClick={toggle}>
              Cerrar
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default StudentImporter;
