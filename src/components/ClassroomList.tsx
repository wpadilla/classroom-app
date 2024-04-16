import React, {useEffect, useMemo, useState} from 'react';
import {Table, Button, FormGroup, Label, Input, Container} from 'reactstrap';
import {IClassroom, studentStatusList, studentStatusNames} from "../models/clasroomModel";
import {useSearchParams} from "react-router-dom";
import {toast} from "react-toastify";
import InputMask from "react-input-mask";
import {IWhatsappMessage, sendWhatsappMessage} from "../services/whatsapp";
import {addDoc, collection} from "firebase/firestore";
import {classroomCollectionName, docName, firebaseStoreDB} from "../utils/firebase";

interface ClassroomsListProps {
    classrooms: IClassroom[];
    updateClassrooms: (classrooms: IClassroom) => void;
}


const ClassroomsList: React.FC<ClassroomsListProps> = ({classrooms, updateClassrooms}) => {
    const [classroomData, setClassroomData] = useState<IClassroom[]>(structuredClone(classrooms));
    const [originalClassroomData, setOriginalClassroomData] = useState<IClassroom[]>(classrooms);
    const [selectedClass, setSelectedClass] = useState<{ [key: string]: string }>({});
    const [editMode, setEditMode] = useState<{ [classroomId: string]: boolean }>({});
    const [searchParams, setSearchParams] = useSearchParams();
    const isAdmin = useMemo(() => {
        return searchParams.get('admin') === '123456';
    }, [searchParams]);

    useEffect(() => {
        setClassroomData(structuredClone(classrooms));
        setOriginalClassroomData(structuredClone(classrooms));
    }, [classrooms]);
    // const isAdmin = true
    const toggleEditMode = (classroomId: string) => {
        setEditMode(prev => ({
            ...prev,
            [classroomId]: !prev[classroomId]
        }));
    };

    const handleInputChange = (classroomId: string, studentId: string, field: string, value: string) => {
        setClassroomData(prev =>
            prev.map(classroom =>
                classroom.id === classroomId ? {
                    ...classroom,
                    students: classroom.students.map(student =>
                        student.id === studentId ? {...student, [field]: value} : student
                    )
                } : classroom
            )
        );
    };

    const handleClassChange = (classId: string, classroomId: string): void => {
        const selectedClassroom = classrooms.find(c => c.id === classroomId);
        const selectedClassData = selectedClassroom?.classes.find(cl => cl.id === classId);
        setSelectedClass({...selectedClass, [classroomId]: classId});

        setClassroomData(prev => {
            return prev.map(classroom => {
                if (classroom.id === classroomId) {
                    return {
                        ...classroom,
                        currentClass: selectedClassData
                    }
                }
                return classroom;
            })
        })
    };

    const toggleAttendance = (classroomId: string, studentId: string): void => {
        const updatedClassrooms = classroomData.map(classroom => {
            if (classroom.id === classroomId) {
                const updatedStudents = classroom.students.map(student => {
                    if (student.id === studentId) {
                        const isPresent = student.assistance.some(c => c.id === selectedClass[classroomId]);
                        if (isPresent) {
                            student.assistance = student.assistance.filter(c => c.id !== selectedClass[classroomId]);
                        } else {
                            const classSession = classroom.classes.find(c => c.id === selectedClass[classroomId]);
                            if (classSession) {
                                student.assistance.push(classSession);
                            }
                        }
                    }
                    return student;
                });
                return {...classroom, students: updatedStudents};
            }
            return classroom;
        });

        setClassroomData(updatedClassrooms);
    };

    const [selectedClassrooms, setSelectedClassrooms] = useState<IClassroom[]>([]);

    React.useEffect(() => {
        const selectedClasses: any = {}
        setSelectedClassrooms(classrooms.map(item => {
            selectedClasses[item.id] = item.currentClass?.id || '';
            const selectedClassroom = selectedClassrooms.find(c => c.id === item.id);
            return {
                ...item,
                students: selectedClassroom?.students || []
            }
        }));

        setSelectedClass(selectedClasses);
    }, [classrooms]);
    const toggleStudentSelection = (classroomId: string, studentId: string): void => {
        const data: IClassroom[] = structuredClone(classrooms)
        const updatedClassrooms = selectedClassrooms.map(classroom => {
            if (classroom.id === classroomId) {
                const studentExists = classroom.students.some(student => student.id === studentId);
                if (studentExists) {
                    // Remove student from selection
                    classroom.students = classroom.students.filter(student => student.id !== studentId);
                } else {
                    // Add student to selection
                    const originalStudent = classrooms.find(c => c.id === classroomId)?.students.find(s => s.id === studentId);
                    if (originalStudent) {
                        classroom.students.push(originalStudent);
                    }
                }
            }
            return classroom;
        });
        setSelectedClassrooms(updatedClassrooms);
    };

    const toggleSelectAll = (classroomId: string, selectAll: boolean): void => {
        const newSelectedClassrooms = selectedClassrooms.map(classroom => {
            if (classroom.id === classroomId) {
                if (selectAll) {
                    // Select all students
                    const originalStudents = classrooms.find(c => c.id === classroomId)?.students || [];
                    classroom.students = originalStudents;
                } else {
                    // Deselect all students
                    classroom.students = [];
                }
            }
            return classroom;
        });
        setSelectedClassrooms(newSelectedClassrooms);
    };

    const isStudentSelected = (classroomId: string, studentId: string): boolean => {
        return selectedClassrooms.find(c => c.id === classroomId)?.students.some(s => s.id === studentId) ?? false;
    };

    const passStudentToClassroom = ({target: {value}}: any) => {
        const [currentClassroom, classroomId, studentId] = value.split('-');
        const student = classroomData.find(c => c.id === currentClassroom)?.students.find(s => s.id === studentId);
        if (!student) {
            return;
        }
        const updatedClassrooms = classroomData.map(classroom => {
            if (classroom.id === currentClassroom) {
                classroom.students = classroom.students.filter(s => s.id !== studentId);
            }
            if (classroom.id === classroomId) {
                classroom.students = [...classroom.students, student];
            }
            return classroom;
        });

        setClassroomData(updatedClassrooms);
    }

    const [teacherPhone, setTeacherPhone] = useState<string>('');
    const [selectedClassroom, setSelectedClassroom] = useState<IClassroom>();
    const onTeacherPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        const phone = e.target.value.replace(/[- ()+_]/g, '')
        setTeacherPhone(phone);
    }

    React.useEffect(() => {
        const phone = localStorage.getItem('teacherPhone');
        if (phone) {
            setTeacherPhone(phone);
        }
    }, [])

    React.useEffect(() => {
        if (teacherPhone.length >= 10) {
            const index = classrooms.findIndex(c => c.teacher.phone === teacherPhone);
            if (index !== -1) {
                setSelectedClassroom(classrooms[index]);
                localStorage.setItem('teacherPhone', teacherPhone);
                if (!selectedClassroom) {
                    toast('Sesion Iniciada', {type: 'success'})
                }
            }
        }
    }, [teacherPhone, classrooms])

    const updateChangedClassrooms = async (changedClassrooms: IClassroom[]) => {
        // setLoading(true);
        await Promise.all(changedClassrooms.map(async changedClassroom => {
            await updateClassrooms(changedClassroom);
        }));
        // setLoading(false);
    }


    React.useEffect(() => {
        if (selectedClassroom) {
            setSelectedClassroom(classroomData.find(c => c.id === selectedClassroom.id))
        }

        const changedClassrooms = classroomData.filter(item => {
            if (classrooms.find(c => JSON.stringify(c) === JSON.stringify(item))) {
                return false;
            }
            return true;
        });

        console.log('<== changedClassrooms =>', changedClassrooms);

        updateChangedClassrooms(changedClassrooms);

    }, [classroomData]);


    const logOut = () => {
        setTeacherPhone('');
        setSelectedClassroom(undefined);
        localStorage.removeItem('teacherPhone');
    }

    const availableSendMessage = useMemo(() => {
        return selectedClassrooms.filter(c => c.students.length > 0).length > 0;
    }, [selectedClassrooms])


    const [loading, setLoading] = useState(false);
    const handleSendMessage = async () => {
        setLoading(true);
        await Promise.all(selectedClassrooms.map(async classroom => {
            const message: IWhatsappMessage = {
                text: `Hola @firstName, Dios te bendiga 🙌 este jueves comenzamos nuestra formación bíblica, recuerda que perteneces en la clase de *${classroom.name}* 📖 con *${classroom.teacher.firstName} ${classroom.teacher.lastName}* 🔥 el material estará disponible hoy en el culto y el Jueves en el *Profeta Moisés* por un precio de RD$${classroom.materialPrice} pesos. Bendiciones!`,
            }
            await sendWhatsappMessage('wpadilla', classroom.students.filter(item => !!item.phone), message)
            if (classroom.students.length > 0) {
                toast(`Mensaje enviado a estudiantes de ${classroom.name}`, {type: 'success'})
            }
        }))
        setSelectedClassrooms(selectedClassrooms.map(c => ({...c, students: []})))
        setLoading(false);
    };

    return (
        <Container style={{width: '100%', minHeight: '100dvh'}}
                   className="p-0 py-4 d-flex flex-column justify-content-center align-items-center">
            {
                loading &&
                <div
                    className="position-fixed opacity-75 z-3 w-100 h-100 top-0 left-0 bg-dark d-flex align-items-center justify-content-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            }
            <div className="mb-4 mt-2 w-100 align-items-center justify-content-around">
                {selectedClassroom && <Button color="danger" onClick={logOut}>
                    Cerrar Sesión
                </Button>}
                {isAdmin &&
                    <Button
                        disabled={!availableSendMessage}
                        color="primary"
                        onClick={handleSendMessage}
                    >
                        Enviar Mensaje
                    </Button>}
            </div>
            {!isAdmin && !selectedClassroom ? <FormGroup>
                <Label><h2>Teléfono del Profesor</h2></Label> <br/>
                <InputMask className="form-control mb-3" placeholder="Numero de whatsapp"
                           type="tel"
                           name="phone"
                           value={teacherPhone}
                           onChange={onTeacherPhoneChange}
                           mask="+1 (999) 999-9999"/>
            </FormGroup> : <>
                {(selectedClassroom ? [selectedClassroom] : classroomData).map(classroom => (
                    <div key={classroom.id} className="classroom-block mb-4 p-3 border w-100">
                        <h3>{classroom.name} -
                            Profesor/a: {`${classroom.teacher.firstName} ${classroom.teacher.lastName}`}</h3>
                        <div className="d-flex gap-2 align-items-center my-3">
                            {isAdmin &&
                                <>
                                    <Button color="primary" onClick={() => toggleSelectAll(classroom.id, true)}>Select
                                        All</Button>
                                    <Button color="secondary" onClick={() => toggleSelectAll(classroom.id, false)}>Deselect
                                        All
                                    </Button>
                                </>
                            }
                            <Button color="primary" onClick={() => toggleEditMode(classroom.id)}>
                                {editMode[classroom.id] ? 'Save' : 'Edit'}
                            </Button>
                        </div>
                        <FormGroup>
                            <Label for={`selectClass${classroom.id}`}>Seleccionar Clase</Label>
                            <Input type="select" id={`selectClass${classroom.id}`}
                                   value={selectedClass[classroom.id] || ''}
                                   onChange={e => handleClassChange(e.target.value, classroom.id)}>
                                <option value="">Seleccionar</option>
                                {classroom.classes.map(cl => (
                                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                                ))}
                            </Input>
                        </FormGroup>
                        <Table striped>
                            <thead>
                            <tr>
                                {/*<th>#</th>*/}
                                <th>Nombre</th>
                                <th>Apellido</th>
                                {isAdmin && <th>Telefono</th>}
                                <th>Asistencia</th>
                                <th>Estado</th>
                                {isAdmin && <th>Actions</th>}
                            </tr>
                            </thead>
                            <tbody>
                            {classroom.students.map((student, index) => (
                                <tr key={student.id}
                                    className={student.assistance.some(c => c.id === selectedClass[classroom.id]) ? 'table-success' : ''}>
                                    {/*<td>{index + 1}</td>*/}
                                    <td>
                                        {editMode[classroom.id] ? (
                                            <Input type="text" value={student.firstName}
                                                   onChange={(e) => handleInputChange(classroom.id, student.id, 'firstName', e.target.value)}/>
                                        ) : (
                                            student.firstName
                                        )}
                                    </td>
                                    <td>
                                        {editMode[classroom.id] ? (
                                            <Input type="text" value={student.lastName}
                                                   onChange={(e) => handleInputChange(classroom.id, student.id, 'lastName', e.target.value)}/>
                                        ) : (
                                            student.lastName
                                        )}
                                    </td>
                                    {isAdmin && <td>
                                        {editMode[classroom.id] ? (
                                            <Input type="text" value={student.phone}
                                                   onChange={(e) => handleInputChange(classroom.id, student.id, 'phone', e.target.value)}/>
                                        ) : (
                                            student.phone
                                        )}
                                    </td>}
                                    <td>
                                        <Button
                                            disabled={!selectedClass[classroom.id]}
                                            color={student.assistance.some(c => c.id === selectedClass[classroom.id]) ? 'danger' : 'info'}
                                            onClick={() => toggleAttendance(classroom.id, student.id)}>
                                            {student.assistance.some(c => c.id === selectedClass[classroom.id]) ? 'Marcar Ausente' : 'Marcar Presente'}
                                        </Button>
                                    </td>
                                    <td>
                                        <Input type="select" value={student.status || ''}
                                               onChange={(e) => handleInputChange(classroom.id, student.id, 'status', e.target.value)}>
                                            <option value="">Estado</option>
                                            {studentStatusList.map(status =>
                                                <option key={status}
                                                        value={status}>{studentStatusNames[status]}</option>)}
                                        </Input>
                                    </td>
                                    {isAdmin &&
                                        <td>
                                            <div className="d-flex gap-4 align-items-center">
                                                <Input type="select" value={student.status || ''}
                                                       onChange={passStudentToClassroom}>
                                                    <option value="">Pasar a</option>
                                                    {classrooms.map(c =>
                                                        <option key={`selector-classroom-${c.id}`}
                                                                value={`${classroom.id}-${c.id}-${student.id}`}>{c.name}</option>)}
                                                </Input>
                                                <Input
                                                    type="checkbox"
                                                    checked={isStudentSelected(classroom.id, student.id)}
                                                    onChange={() => toggleStudentSelection(classroom.id, student.id)}
                                                />
                                            </div>
                                        </td>}
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    </div>
                ))}
            </>}
        </Container>
    );
};

export default ClassroomsList;
