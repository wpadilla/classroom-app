import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    Table,
    Button,
    FormGroup,
    Label,
    Input,
    Container,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader, Badge
} from 'reactstrap';
import {IClasses, IClassroom, IStudent, studentStatusList, studentStatusNames} from "../models/clasroomModel";
import {useSearchParams} from "react-router-dom";
import {toast} from "react-toastify";
import InputMask from "react-input-mask";
import {IWhatsappMessage, sendWhatsappMessage} from "../services/whatsapp";
import {addDoc, collection} from "firebase/firestore";
import {classroomCollectionName, docName, firebaseStoreDB} from "../utils/firebase";
import {generateCustomID} from "../utils/generators";
import _ from "lodash";
import {debounceUpdate} from "../screens/Classrooms";

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

    const isSupervisor = useMemo(() => {
        return searchParams.get('supervisor') === '123456';
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
            // const originalClassroom = classrooms.find(c => c.id === changedClassroom.id);
            // const originalStudents = originalClassroom?.students.map(it => ({
            //     firstName: it.firstName,
            //     lastName: it.lastName,
            //     phone: it.phone
            // }))
            // const updatedStudents = changedClassroom?.students.map(it => ({
            //     firstName: it.firstName,
            //     lastName: it.lastName,
            //     phone: it.phone
            // }))

            // if(JSON.stringify(updatedStudents) !== JSON.stringify(originalStudents)) {
            //     debounceUpdate(changedClassroom);
            // } else {
            await updateClassrooms(changedClassroom);
            // }
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
                text: `Dios te bendiga @firstName la formación ya comenzó 🙌 *aún estas a tiempo de integrarte* a la clase de *${classroom.subject}* en el aula *${classroom.name}* este jueves a las 7PM en el Profeta Moisés 🔥.

_Deseen con ansias la leche pura de la palabra, como niños recién nacidos. Así, por medio de ella, crecerán en su salvación._
1 Pedro 2:2`
                // text: `Hola @firstName, Dios te bendiga 🙌 ¡hoy comenzamos nuestra formación bíblica! 🥳 tu aula sera *${classroom.name}* entra en ella desde que llegues ⚡️✅ no te quedes en la abajo 🚫 recuerda que perteneces en la clase de *${classroom.subject}* 📖 con *${classroom.teacher.firstName} ${classroom.teacher.lastName}* 🔥 el material estará disponible en tu aula, el precio es *_RD$${classroom.materialPrice}_* pesos. Bendiciones!`,
                // text: `Hola @firstName, Dios te bendiga 🙌 recuerda que hoy comienzas el discipulado en la iglesia 🥳 tu maestra sera *${classroom.teacher.firstName} ${classroom.teacher.lastName}* 🔥 el material estará disponible cuando llegues, el precio es de *_RD$${classroom.materialPrice}_* pesos. Bendiciones!`,
            }

            const students = classroom.students.filter(item => !!item.phone);
            if (students.length) {
                await sendWhatsappMessage('wpadilla', students, message)
            }

            if (classroom.students.length > 0) {
                toast(`Mensaje enviado a estudiantes de ${classroom.subject}`, {type: 'success'})
            }
        }))
        setSelectedClassrooms(selectedClassrooms.map(c => ({...c, students: []})))
        setLoading(false);
    };

    const addNewClass = (classroom: IClassroom) => () => {
        const newClass: IClasses = {
            id: generateCustomID(),
            name: `Semana ${classroom.classes.length + 1}`,
            date: new Date(),
        }

        setClassroomData(prev => prev.map(c => c.id === classroom.id ? {
            ...c,
            classes: [...c.classes, newClass]
        } : c));

    }

    const deleteClass = (classroomId: string) => {
        setClassroomData(prev => prev.map(c => c.id === classroomId ? {
            ...c,
            classes: c.classes.slice(0, c.classes.length - 1)
        } : c));
    }

    const [addNewStudentClassroomId, setAddNewStudentClassroomId] = useState<string | null>(null);

    const resetAddNewStudentClassroom = () => setAddNewStudentClassroomId(null);
    const [newStudent, setNewStudent] = useState({firstName: '', lastName: '', phone: ''});
    const onChangeNewStudent = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.type === 'tel') {
            e.target.value = e.target.value.replace(/[- ()+_]/g, '')
        }
        console.log('type', e.target.value);

        setNewStudent(prev => ({...prev, [e.target.name]: e.target.value}))
    }

    const addNewStudent = async () => {
        if (!addNewStudentClassroomId) return;
        const newStudentData: IStudent = {
            ...newStudent,
            id: generateCustomID(),
            role: 'student',
            evaluation: {
                test: 0,
                exposition: 0,
                participation: 0,
                assistance: []
            },
            assistance: []
        }

        setClassroomData(prev => prev.map(c => c.id === addNewStudentClassroomId ? {
            ...c,
            students: [...c.students, newStudentData]
        } : c));

        setNewStudent({firstName: '', lastName: '', phone: ''})
        setAddNewStudentClassroomId(null);
    }


    const onChangeClassroomDetails = (classroom: IClassroom) => ({target: {value, name, type}}: any) => {
        if (type === 'number') {
            value = Number(value);
        }

        if (type === 'tel') {
            value = value.replace(/[- ()+_]/g, '')
        }

        setClassroomData(prev => prev.map(c => {
            if (c.id === classroom.id) {
                _.set(c, name, value);
            }

            return c
        }))
    }

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
            {selectedClassroom && <Button color="danger" onClick={logOut}>
                Cerrar Sesión
            </Button>}
            <div
                className="mb-4 mt-2 w-100 d-flex align-items-center justify-content-center gap-3 position-sticky top-0 bg-white py-2"
                style={{zIndex: '99'}}>
                {isAdmin &&
                    <Button
                        disabled={!availableSendMessage}
                        color="primary"
                        onClick={handleSendMessage}
                    >
                        Enviar Mensaje
                    </Button>}
            </div>
            {(!isAdmin && !selectedClassroom) && !isSupervisor ? <FormGroup>
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
                        <h3>{classroom.subject} -
                            Profesor/a: {`${classroom.teacher.firstName} ${classroom.teacher.lastName}`}
                            {/*<Input*/}
                            {/*    type="checkbox"*/}
                            {/*    checked={isStudentSelected(classroom.id, student.id)}*/}
                            {/*    onChange={() => toggleStudentSelection(classroom.id, student.id)}*/}
                            {/*/>*/}
                        </h3>
                        <span className="text-secondary">{classroom.students.length + 1} Estudiantes</span>
                        <div
                            className="d-flex gap-2 align-items-center my-3 flex-wrap position-sticky bg-white p-3 w-100"
                            style={{top: isAdmin ? "50px" : "0px", zIndex: "9"}}>
                            <div className="d-flex w-100 gap-3 align-items-center">
                                <Button color="primary" className="w-100 text-nowrap"
                                        onClick={() => toggleEditMode(classroom.id)}>
                                    {editMode[classroom.id] ? 'Guardar' : 'Editar'}
                                </Button>
                                <Button color="primary" className="w-100 text-nowrap"
                                        onClick={() => setAddNewStudentClassroomId(classroom.id)}>
                                    Agregar Estudiante
                                </Button>
                            </div>
                            {isAdmin &&
                                <>
                                    <Button color="primary" onClick={() => toggleSelectAll(classroom.id, true)}>Select
                                        All</Button>
                                    <Button color="secondary" onClick={() => toggleSelectAll(classroom.id, false)}>Deselect
                                        All
                                    </Button>
                                </>
                            }
                        </div>
                        {isAdmin && editMode[classroom.id] && <div className="w-100 d-flex flex-column gap-3 mb-3">
                            <Input type="text" value={classroom.subject} name="subject"
                                   onChange={onChangeClassroomDetails(classroom)}
                                   placeholder="Materia"/>
                            <Input type="text" value={classroom.name} name="name"
                                   onChange={onChangeClassroomDetails(classroom)}
                                   placeholder="Nombre del Aula"/>
                            <Input type="number" value={classroom.materialPrice} name="materialPrice"
                                   onChange={onChangeClassroomDetails(classroom)}
                                   placeholder="Precio del material"/>
                            <Input type="text" value={classroom.teacher.firstName} name="teacher.firstName"
                                   onChange={onChangeClassroomDetails(classroom)}
                                   placeholder="Teacher name"/>
                            <Input type="text" value={classroom.teacher.lastName} name="teacher.lastName"
                                   onChange={onChangeClassroomDetails(classroom)}
                                   placeholder="Teacher lastName"/>
                            <InputMask
                                className="form-control" type="tel" mask="+1 (999) 999-9999"
                                value={classroom.teacher.phone} name="teacher.phone"
                                onChange={onChangeClassroomDetails(classroom)}
                                placeholder="Teacher lastName"/>

                        </div>}
                        <FormGroup>
                            <Label className="w-100" for={`selectClass${classroom.id}`}>Seleccionar Clase</Label>
                            <div className="d-flex align-items-center gap-2 flex-lg-row flex-column">
                                <Input type="select" id={`selectClass${classroom.id}`}
                                       value={selectedClass[classroom.id] || ''}
                                       onChange={e => handleClassChange(e.target.value, classroom.id)}>
                                    <option value="">Seleccionar</option>
                                    {classroom.classes.map(cl => (
                                        <option key={cl.id} value={cl.id}>{cl.name}</option>
                                    ))}
                                </Input>
                                {isAdmin &&
                                    <div className="d-flex align-items-center gap-3">
                                        <Button color="primary" className="text-nowrap"
                                                onClick={addNewClass(classroom)}>Agregar
                                            Clase</Button>
                                        <Button color="danger" className="text-nowrap"
                                                onClick={() => deleteClass(classroom.id)}>Eliminar
                                            Clase</Button>
                                    </div>}
                            </div>
                        </FormGroup>
                        <Table striped responsive>
                            <thead>
                            <tr>
                                {/*<th>#</th>*/}
                                <th>Nombre</th>
                                {editMode[classroom.id] && <th>Apellido</th>}
                                <th>Asistencia</th>
                                <th>Teléfono</th>
                                {selectedClass[classroom.id] === classroom.classes[classroom.classes.length - 1].id &&
                                    <th>Estado</th>}

                                {isAdmin && <th>Actions</th>}
                            </tr>
                            </thead>
                            <tbody>
                            {classroom.students.map((student, index) => {
                                    const isPresent = !!student.assistance.some(c => c.id === selectedClass[classroom.id]);
                                    return (
                                        <tr key={student.id}
                                            className={isPresent ? 'table-success' : ''}>
                                            {/*<td>{index + 1}</td>*/}
                                            <td>
                                                {editMode[classroom.id] ? (
                                                    <Input type="text" value={student.firstName}
                                                           onChange={(e) => handleInputChange(classroom.id, student.id, 'firstName', e.target.value)}/>
                                                ) : (
                                                    <span>{student.firstName} {student.lastName}</span>

                                                )}
                                            </td>
                                            {editMode[classroom.id] && <td>
                                                {editMode[classroom.id] ? (
                                                    <Input type="text" value={student.lastName}
                                                           onChange={(e) => handleInputChange(classroom.id, student.id, 'lastName', e.target.value)}/>
                                                ) : (
                                                    student.lastName
                                                )}
                                            </td>}
                                            <td>
                                                <div
                                                    className="d-flex flex-column align-items-center justify-content-center gap-2">
                                                    {isPresent && <Badge color="success"><b>¡Presente!</b></Badge>}
                                                    <Button
                                                        disabled={!selectedClass[classroom.id]}
                                                        color={student.assistance.some(c => c.id === selectedClass[classroom.id]) ? 'danger' : 'info'}
                                                        onClick={() => toggleAttendance(classroom.id, student.id)}>
                                                        {student.assistance.some(c => c.id === selectedClass[classroom.id]) ? 'Marcar Ausente' : 'Marcar Presente'}
                                                    </Button>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column gap-3">
                                                    {editMode[classroom.id] ? (
                                                        <Input type="text" value={student.phone}
                                                               onChange={(e) => handleInputChange(classroom.id, student.id, 'phone', e.target.value)}/>
                                                    ) : (
                                                        student.phone
                                                    )}
                                                    {!editMode[classroom.id] && student.phone.length >= 10 &&
                                                        <Button color="success">
                                                            <a target="_blank"
                                                               className="text-nowrap text-white text-decoration-none"
                                                               href={`https://wa.me/${student.phone}?text=Hola ${student.firstName}, Dios te bendiga.`}
                                                               rel="noreferrer">
                                                                Ir a Whatsapp
                                                            </a>
                                                        </Button>}
                                                </div>
                                            </td>
                                            {selectedClass[classroom.id] === classroom.classes[classroom.classes.length - 1].id &&
                                                <td>
                                                    <Input type="select" value={student.status || ''}
                                                           onChange={(e) => handleInputChange(classroom.id, student.id, 'status', e.target.value)}>
                                                        <option value="">Estado</option>
                                                        {studentStatusList.map(status =>
                                                            <option key={status}
                                                                    value={status}>{studentStatusNames[status]}</option>)}
                                                    </Input>
                                                </td>}

                                            <td>
                                                <div className="d-flex gap-4 align-items-center">
                                                    {isAdmin && <>
                                                        <Input type="select" value={student.status || ''}
                                                               onChange={passStudentToClassroom}>
                                                            <option value="">Pasar a</option>
                                                            {classrooms.map(c =>
                                                                <option key={`selector-classroom-${c.id}`}
                                                                        value={`${classroom.id}-${c.id}-${student.id}`}>{c.subject}</option>)}
                                                        </Input>
                                                        <Input
                                                            type="checkbox"
                                                            checked={isStudentSelected(classroom.id, student.id)}
                                                            onChange={() => toggleStudentSelection(classroom.id, student.id)}
                                                        />
                                                        <Button color="danger"
                                                                onClick={() => setClassroomData(prev => prev.map(c => c.id === classroom.id ? {
                                                                    ...c,
                                                                    students: c.students.filter(s => s.id !== student.id)
                                                                } : c))}>
                                                            Eliminar
                                                        </Button>
                                                    </>
                                                    }
                                                </div>
                                            </td>
                                        </tr>)
                                }
                            )}
                            </tbody>
                        </Table>
                    </div>
                ))}
            </>}
            <Modal isOpen={!!addNewStudentClassroomId} toggle={resetAddNewStudentClassroom}>
                <ModalBody>
                    <ModalHeader>
                        Agregar Estudiante
                    </ModalHeader>
                    <FormGroup className="d-flex gap-3 flex-column mt-4 mb-4">
                        <Input type="text" placeholder="Nombre" name="firstName" onChange={onChangeNewStudent}
                               value={newStudent.firstName}/>
                        <Input type="text" placeholder="Apellido" name="lastName" onChange={onChangeNewStudent}
                               value={newStudent.lastName}/>
                        <InputMask className="form-control" type="tel" placeholder="Teléfono" name="phone"
                                   onChange={onChangeNewStudent} value={newStudent.phone} mask="+1 (999) 999-9999"/>
                    </FormGroup>
                    <ModalFooter>
                        <Button color="danger" onClick={resetAddNewStudentClassroom} outline>Cancelar</Button>
                        <Button color="primary" onClick={addNewStudent} outline>Agregar</Button>
                    </ModalFooter>
                </ModalBody>
            </Modal>
        </Container>
    );
};

export default ClassroomsList;
