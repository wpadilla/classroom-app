import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
    ModalHeader, Badge, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Nav, NavItem, NavLink, TabPane, TabContent
} from 'reactstrap';
import {
    IClasses,
    IClassroom,
    IStudent,
    studentStatusList,
    studentStatusNames,
    StudentStatusTypes
} from "../models/clasroomModel";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import InputMask from "react-input-mask";
import { IWhatsappMessage, sendWhatsappMessage } from "../services/whatsapp";
import { generateCustomID } from "../utils/generators";
import { filterBySearch } from "../utils/searchUtils";
import _ from "lodash";

interface ClassroomsListProps {
    classrooms: IClassroom[];
    originalClassrooms?: IClassroom[]; // For selectors that shouldn't be affected by filters
    updateClassrooms: (classrooms: IClassroom) => void;
    exportClassroom: (format: 'excel' | 'text', status: StudentStatusTypes | 'all', classroomId: string) => void;
    globalSearchQuery?: string; // For global search filtering
    onClassroomDataChange?: (classrooms: IClassroom[]) => void; // Callback to notify parent of data changes
}

const DEFAULT_MESSAGE = `Hola @firstName, Dios te bendiga 🙌 ¡Este jueves comenzamos nuestra formación bíblica! 🥳 tu aula sera *{classroomName}* entra en ella desde que llegues ⚡️✅ no te quedes abajo 🚫 recuerda que perteneces en la clase de *{subject}* 📖 con *{teacherFirstName} {teacherLastName}* 🔥 el material estará disponible en tu aula, el precio es *_RD\${materialPrice}_* pesos. Bendiciones!`;

const STORAGE_KEY = 'whatsapp-message-template';

const ClassroomsList: React.FC<ClassroomsListProps> = ({ classrooms, originalClassrooms, updateClassrooms, exportClassroom, globalSearchQuery, onClassroomDataChange }) => {
    const [classroomData, setClassroomData] = useState<IClassroom[]>(structuredClone(originalClassrooms || classrooms));
    const [originalClassroomData, setOriginalClassroomData] = useState<IClassroom[]>(originalClassrooms || classrooms);
    const [selectedClass, setSelectedClass] = useState<{ [key: string]: string }>({});
    const [editMode, setEditMode] = useState<{ [classroomId: string]: boolean }>({});
    const [searchParams, setSearchParams] = useSearchParams();
    const isAdmin = useMemo(() => {
        return searchParams.get('admin') === '123456';
    }, [searchParams]);

    const isSupervisor = useMemo(() => {
        return searchParams.get('supervisor') === '123456';
    }, [searchParams]);
    const [selectedClassroomId, setSelectedClassroomId] = useState<string>(classrooms.length ? classrooms[0].id : '');
    const [activeTab, setActiveTab] = useState<string>('');
    const [showAll, setShowAll] = useState<boolean>(false);
    const [searchQueries, setSearchQueries] = useState<{ [classroomId: string]: string }>({});

    useEffect(() => {
        
        const incoming = structuredClone(classrooms);
        const incoming2 = structuredClone(originalClassrooms || classrooms);
        // Avoid resetting local state if content didn't change
        if (!_.isEqual(incoming, classroomData) && !classroomData?.length) {
            setClassroomData(incoming);
        }
        if (!_.isEqual(incoming2, originalClassroomData) && !originalClassroomData?.length) {
            setOriginalClassroomData(incoming2);
        }
        // if (classrooms.length) {
        //     setSelectedClassroomId(classrooms[0].id);
        //     setActiveTab(classrooms[0].id);
        // }
    }, [originalClassrooms, classrooms]);

    // Notify parent component when classroomData changes
    useEffect(() => {
        const base = originalClassrooms || classrooms;
        if (onClassroomDataChange && !_.isEqual(classroomData, base)) {
            onClassroomDataChange(classroomData);
        }
    }, [classroomData, originalClassrooms, classrooms]);

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
                        student.id === studentId ? { ...student, [field]: value } : student
                    )
                } : classroom
            )
        );
    };

    const handleClassChange = (classId: string, classroomId: string): void => {
        const selectedClassroom = classrooms.find(c => c.id === classroomId);
        const selectedClassData = selectedClassroom?.classes.find(cl => cl.id === classId);
        setSelectedClass({ ...selectedClass, [classroomId]: classId });

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
                return { ...classroom, students: updatedStudents };
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

    const passMultipleStudentToClassroom = (classroomId: string, targetClassroomId: string) => {
        const updatedClassrooms = classroomData.map(classroom => {
            // Remove selected students from the current classroom
            if (classroom.id === classroomId) {
                classroom.students = classroom.students.filter(student =>
                    !selectedClassrooms.find(c => c.id === classroomId)?.students.some(s => s.id === student.id)
                );
            }
            // Add selected students to the target classroom
            if (classroom.id === targetClassroomId) {
                const selectedStudents = selectedClassrooms.find(c => c.id === classroomId)?.students || [];
                const newStudents = structuredClone(selectedStudents).map((item: IStudent) => ({
                    ...item,
                    status: ''
                }))

                classroom.students = [...classroom.students, ...newStudents];
            }
            return classroom;
        });

        setClassroomData(updatedClassrooms);
        // Clear the selection after moving students
        setSelectedClassrooms(selectedClassrooms.map(c => c.id === classroomId ? { ...c, students: [] } : c));
    };

    const passStudentToClassroom = ({ target: { value } }: any) => {
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
                const newStudent = { ...structuredClone(student), status: '' } as IStudent
                classroom.students = [...classroom.students, newStudent];
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
            const index = classroomData.findIndex(c => c.teacher.phone === teacherPhone);
            if (index !== -1) {
                setSelectedClassroom(classroomData[index]);
                localStorage.setItem('teacherPhone', teacherPhone);
                if (!selectedClassroom) {
                    toast('Sesion Iniciada', { type: 'success' })
                }
            }
        } else {
            const found = classroomData.find(c => c.id === selectedClassroomId);
            found && setSelectedClassroom(found)
        }
    }, [teacherPhone, classroomData, selectedClassroomId])

    // Load message text from localStorage on component mount
    React.useEffect(() => {
        const savedMessage = localStorage.getItem(STORAGE_KEY);
        if (savedMessage) {
            setMessageText(savedMessage);
        }
    }, []);

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

        const base = originalClassrooms || [];
        const baseMap = new Map(base.map(c => [c.id, c]));
        const changedClassrooms = classroomData.filter(item => {
            return baseMap.get(item.id);
        });

        if (changedClassrooms.length) {
            updateChangedClassrooms(changedClassrooms);
        }

    }, [classroomData]);


    const logOut = () => {
        setTeacherPhone('');
        setSelectedClassroom(undefined);
        localStorage.removeItem('teacherPhone');
    }

    const availableStudentSelected = useMemo(() => {
        return selectedClassrooms.filter(c => c.students.length > 0).length > 0;
    }, [selectedClassrooms])


    const [loading, setLoading] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageText, setMessageText] = useState(DEFAULT_MESSAGE);


    const handleSendMessage = async () => {
        setLoading(true);
        await Promise.all(selectedClassrooms.map(async classroom => {
            const message: IWhatsappMessage = {
                //                 text: `Dios te bendiga @firstName la formación ya comenzó 🙌 *aún estas a tiempo de integrarte* a la clase de *${classroom.subject}* en el aula *${classroom.name}* este jueves a las 7PM en el Profeta Moisés 🔥.
                //
                // _Deseen con ansias la leche pura de la palabra, como niños recién nacidos. Así, por medio de ella, crecerán en su salvación._
                // 1 Pedro 2:2`
                text: `Hola @firstName, Dios te bendiga 🙌 ¡Este jueves comenzamos nuestra formación bíblica! 🥳 tu aula sera *${classroom.name}* entra en ella desde que llegues ⚡️✅ no te quedes abajo 🚫 recuerda que perteneces en la clase de *${classroom.subject}* 📖 con *${classroom.teacher.firstName} ${classroom.teacher.lastName}* 🔥 el material estará disponible en tu aula, el precio es *_RD$${classroom.materialPrice}_* pesos. Bendiciones!`,
                // text: `Hola @firstName, Dios te bendiga 🙌 recuerda que hoy comienzas el discipulado en la iglesia 🥳 tu maestra sera *${classroom.teacher.firstName} ${classroom.teacher.lastName}* 🔥 el material estará disponible cuando llegues, el precio es de *_RD$${classroom.materialPrice}_* pesos. Bendiciones!`,
            }

            const students = classroom.students.filter(item => !!item.phone).map(item => ({
                ...item,
                id: `${item.phone}@s.whatsapp.net`
            }));
            if (students.length) {
                const formData = new FormData();
                const messages = Array.isArray(message) ? message : [message];

                formData.append('messages', JSON.stringify(messages));
                formData.append('contacts', JSON.stringify(students));
                formData.append('sessionId', 'bibleAssistant');

                await sendWhatsappMessage('bibleAssistant', formData);
                // await sendWhatsappMessage('bibleAssistant', students, message)
            }

            if (classroom.students.length > 0) {
                toast(`Mensaje enviado a estudiantes de ${classroom.subject}`, { type: 'success' })
            }
        }))
        setSelectedClassrooms(selectedClassrooms.map(c => ({ ...c, students: [] })))
        setLoading(false);
    };

    const openMessageModal = () => {
        setShowMessageModal(true);
    };

    const closeMessageModal = () => {
        setShowMessageModal(false);
    };

    const handleMessageTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setMessageText(newValue);
        localStorage.setItem(STORAGE_KEY, newValue);
    };

    const resetMessageToDefault = () => {
        setMessageText(DEFAULT_MESSAGE);
        localStorage.setItem(STORAGE_KEY, DEFAULT_MESSAGE);
    };

    const sendMessageFromModal = async () => {
        setLoading(true);
        setShowMessageModal(false);
        console.log("selectedClassrooms =>",selectedClassrooms);
        await Promise.all(selectedClassrooms.map(async classroom => {
            // Replace template variables with actual values
            const processedText = messageText
                .replace(/{classroomName}/g, classroom.name || '')
                .replace(/{subject}/g, classroom.subject || '')
                .replace(/{teacherFirstName}/g, classroom.teacher?.firstName || '')
                .replace(/{teacherLastName}/g, classroom.teacher?.lastName || '')
                .replace(/{materialPrice}/g, (classroom.materialPrice || 0).toString());

            const message: IWhatsappMessage = {
                text: processedText,
            }

            const students = classroom.students.filter(item => !!item.phone).map(item => ({
                ...item,
                id: `${item.phone}@s.whatsapp.net`
            }));
            console.log("students =>",students);
            if (students.length) {
                const formData = new FormData();
                const messages = Array.isArray(message) ? message : [message];

                formData.append('messages', JSON.stringify(messages));
                formData.append('contacts', JSON.stringify(students));
                formData.append('sessionId', 'bibleAssistant');

                await sendWhatsappMessage('bibleAssistant', formData);
            }

            if (classroom.students.length > 0) {
                toast(`Mensaje enviado a estudiantes de ${classroom.subject}`, { type: 'success' })
            }
        }))
        setSelectedClassrooms(selectedClassrooms.map(c => ({ ...c, students: [] })))
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
    const [addingStudent, setAddingStudent] = useState(false);

    const resetAddNewStudentClassroom = () => setAddNewStudentClassroomId(null);
    const [newStudent, setNewStudent] = useState({ firstName: '', lastName: '', phone: '' });
    const onChangeNewStudent = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.type === 'tel') {
            e.target.value = e.target.value.replace(/[- ()+_]/g, '')
        }
        console.log('type', e.target.value);

        setNewStudent(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const addNewStudent = async () => {
        if (!addNewStudentClassroomId || addingStudent) return;
        
        setAddingStudent(true);
        
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

        // Find the classroom to update
        const classroomToUpdate = classroomData.find(c => c.id === addNewStudentClassroomId);
        if (!classroomToUpdate) {
            setAddingStudent(false);
            return;
        }

        // Create updated classroom with new student
        const updatedClassroom: IClassroom = {
            ...classroomToUpdate,
            students: [...classroomToUpdate.students, newStudentData]
        };

        try {
            // Optimistic UI: update local state immediately
            setClassroomData(prev => prev.map(c => c.id === addNewStudentClassroomId ? updatedClassroom : c));
            
            setNewStudent({ firstName: '', lastName: '', phone: '' });
            setAddNewStudentClassroomId(null);
            
            toast.success('Estudiante agregado exitosamente');
        } catch (error) {
            console.error('Error adding student:', error);
            toast.error('Error al agregar estudiante');
        } finally {
            setAddingStudent(false);
        }
    }


    const onChangeClassroomDetails = (classroom: IClassroom) => ({ target: { value, name, type } }: any) => {
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
    const [exportDropdownOpen, setExportDropdownOpen] = useState<{ [N in string]: boolean }>({});
    const toggleExportDropdown = (classroomId: string) => () => {
        setExportDropdownOpen(prev => ({ ...prev, [classroomId]: !prev[classroomId] }))
    }

    const toggleTab = (tabId: string) => {
        if (activeTab !== tabId) {
            setActiveTab(tabId);
            setSelectedClassroomId(tabId);
        }
    };

    const handleSearchChange = (classroomId: string, query: string) => {
        setSearchQueries(prev => ({
            ...prev,
            [classroomId]: query
        }));
    };

    const getFilteredStudents = (classroom: IClassroom) => {
        const localQuery = searchQueries[classroom.id] || '';
        const globalQuery = globalSearchQuery || '';
        
        // If there's a local search query, use it; otherwise use global search
        const query = localQuery || globalQuery;
        
        const latest = classroomData.find(c => c.id === classroom.id) || classroom;
        return filterBySearch(latest.students, query);
    };


    return (
        <Container style={{ width: '100%', minHeight: '100dvh' }}
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

            {selectedClassroom && teacherPhone && <Button color="danger" onClick={logOut}>
                Cerrar Sesión
            </Button>}


            <div
                className="mb-4 mt-2 w-100 d-flex align-items-center justify-content-center gap-3 position-sticky top-0 bg-white py-2"
                style={{ zIndex: '99' }}>
                {isAdmin &&
                    <Button
                        disabled={!availableStudentSelected}
                        color="primary"
                        onClick={openMessageModal}
                    >
                        Enviar Mensaje
                    </Button>}
                {isAdmin &&
                    <FormGroup >
                        <Input
                            type="switch"
                            checked={showAll}
                            onChange={() => setShowAll(!showAll)}
                        />
                        <Label>Mostrar todas las clases</Label>
                    </FormGroup>
                }
            </div>

            {isAdmin && <Nav tabs className="d-flex overflow-x-scroll flex-nowrap w-100 p-3">
                {classrooms.map(classroom => (
                    <NavItem key={classroom.id} className="white-space-nowrap text-nowrap" style={{
                        width: '100%',
                        minWidth: '200px',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'inline-block',
                        cursor: 'pointer'
                    }}>
                        <NavLink
                            className={activeTab === classroom.id ? 'active' : ''}
                            onClick={() => toggleTab(classroom.id)}
                        >
                            {classroom.subject}
                        </NavLink>
                    </NavItem>
                ))}
            </Nav>}

            {(!isAdmin && !selectedClassroom) && !isSupervisor ? <FormGroup>
                <Label><h2>Teléfono del Profesor</h2></Label> <br />
                <InputMask className="form-control mb-3" placeholder="Numero de whatsapp"
                    type="tel"
                    name="phone"
                    value={teacherPhone}
                    onChange={onTeacherPhoneChange}
                    mask="+1 (999) 999-9999" />
            </FormGroup> : <>
                {/*<TabContent activeTab={activeTab}>*/}
                {/*    {classrooms.map(classroom => (*/}
                {/*        <TabPane tabId={classroom.id} key={classroom.id}>*/}
                {/*            {classroom.id}*/}
                {/*        </TabPane>*/}
                {/*    ))}*/}
                {/*</TabContent>*/}
                {(selectedClassroom && !showAll ? [selectedClassroom] : classrooms).map(classroom => {
                    const latestClassroom = classroomData.find(c => c.id === classroom.id) || classroom;
                    return (
                        <div key={classroom.id} className="classroom-block mb-4 p-3 border w-100">
                            <h3>{latestClassroom.subject} -
                                Profesor/a: {`${latestClassroom.teacher.firstName} ${latestClassroom.teacher.lastName}`}
                            </h3>
                            <span className="text-secondary">{getFilteredStudents(latestClassroom).length} de {latestClassroom.students.length} Estudiantes</span>
                            
                            {/* Search input for this classroom */}
                            <div className="my-3">
                                <Input
                                    type="text"
                                    placeholder="Buscar estudiantes en esta aula..."
                                    value={searchQueries[classroom.id] || ''}
                                    onChange={(e) => handleSearchChange(classroom.id, e.target.value)}
                                    className="mb-2"
                                />
                            </div>
                            <div
                                className="d-flex gap-2 align-items-center my-3 flex-wrap position-sticky bg-white p-3 w-100"
                                style={{ top: isAdmin ? "50px" : "0px", zIndex: "9" }}>
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
                                    <div className="d-flex w-100 gap-3 justify-content-between">
                                        <div className="d-flex gap-3 w-100">
                                            <Button color="primary" onClick={() => toggleSelectAll(classroom.id, true)}>Select
                                                All</Button>
                                            <Button color="secondary" onClick={() => toggleSelectAll(classroom.id, false)}>Deselect
                                                All
                                            </Button>
                                            <Dropdown isOpen={exportDropdownOpen[classroom.id]}
                                                toggle={toggleExportDropdown(classroom.id)}>
                                                <DropdownToggle color="success" caret>
                                                    Export Classroom
                                                </DropdownToggle>
                                                <DropdownMenu>
                                                    <DropdownItem header>Excel</DropdownItem>
                                                    <DropdownItem
                                                        onClick={() => exportClassroom('excel', 'all', classroom.id)}>Todos</DropdownItem>
                                                    <DropdownItem
                                                        onClick={() => exportClassroom('excel', 'approved', classroom.id)}>Approved</DropdownItem>
                                                    <DropdownItem
                                                        onClick={() => exportClassroom('excel', 'outstanding', classroom.id)}>Outstanding</DropdownItem>
                                                    <DropdownItem
                                                        onClick={() => exportClassroom('excel', 'failed', classroom.id)}>Failed</DropdownItem>
                                                </DropdownMenu>
                                            </Dropdown>
                                        </div>
                                        {availableStudentSelected &&
                                            <Input
                                                type="select"
                                                onChange={(e) => passMultipleStudentToClassroom(classroom.id, e.target.value)}
                                                value=""
                                            >
                                                <option value="" disabled>Pasar seleccionados a</option>
                                                {classrooms.filter(c => c.id !== classroom.id).map(c =>
                                                    <option key={`selector-classroom-${c.id}`} value={c.id}>
                                                        {c.subject}
                                                    </option>
                                                )}
                                            </Input>}
                                    </div>
                                }
                            </div>

                            <FormGroup>
                                <Label className="w-100" for={`selectClass${classroom.id}`}>Seleccionar Clase</Label>
                                <div className="d-flex align-items-center gap-2 flex-lg-row flex-column">
                                    <Input type="select" id={`selectClass${classroom.id}`}
                                        value={selectedClass[classroom.id] || ''}
                                        onChange={e => handleClassChange(e.target.value, classroom.id)}>
                                        <option value="">Seleccionar</option>
                                        {latestClassroom.classes.map(cl => (
                                            <option key={cl.id} value={cl.id}>{cl.name}</option>
                                        ))}
                                    </Input>
                                    {isAdmin &&
                                        <div className="d-flex align-items-center gap-3">
                                            <Button color="primary" className="text-nowrap"
                                                onClick={addNewClass(latestClassroom)}>Agregar
                                                Clase</Button>
                                            <Button color="danger" className="text-nowrap"
                                                onClick={() => deleteClass(latestClassroom.id)}>Eliminar
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
                                        {selectedClass[classroom.id] === latestClassroom.classes[latestClassroom.classes.length - 1]?.id &&
                                            <th>Estado</th>}

                                        {isAdmin && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {getFilteredStudents(latestClassroom).map((student, index) => {
                                        const isPresent = !!student.assistance.some(c => c.id === selectedClass[classroom.id]);
                                        return (
                                            <tr key={student.id}
                                                className={isPresent ? 'table-success' : ''}>
                                                {/*<td>{index + 1}</td>*/}
                                                <td>
                                                    {editMode[classroom.id] ? (
                                                        <Input type="text" value={student.firstName}
                                                            onChange={(e) => handleInputChange(classroom.id, student.id, 'firstName', e.target.value)} />
                                                    ) : (
                                                        <span>{student.firstName} {student.lastName}</span>

                                                    )}
                                                </td>
                                                {editMode[classroom.id] && <td>
                                                    {editMode[classroom.id] ? (
                                                        <Input type="text" value={student.lastName}
                                                            onChange={(e) => handleInputChange(classroom.id, student.id, 'lastName', e.target.value)} />
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
                                                                onChange={(e) => handleInputChange(classroom.id, student.id, 'phone', e.target.value)} />
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
                                                {selectedClass[classroom.id] === latestClassroom.classes[latestClassroom.classes.length - 1].id &&
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
                                                                {(originalClassrooms || classrooms).map(c =>
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
                    );
                })}
            </>}
            <Modal isOpen={!!addNewStudentClassroomId} toggle={resetAddNewStudentClassroom}>
                <ModalBody>
                    <ModalHeader>
                        Agregar Estudiante
                    </ModalHeader>
                    <FormGroup className="d-flex gap-3 flex-column mt-4 mb-4">
                        <Input type="text" placeholder="Nombre" name="firstName" onChange={onChangeNewStudent}
                            value={newStudent.firstName} />
                        <Input type="text" placeholder="Apellido" name="lastName" onChange={onChangeNewStudent}
                            value={newStudent.lastName} />
                        <InputMask className="form-control" type="tel" placeholder="Teléfono" name="phone"
                            onChange={onChangeNewStudent} value={newStudent.phone} mask="+1 (999) 999-9999" />
                    </FormGroup>
                    <ModalFooter>
                        <Button color="danger" onClick={resetAddNewStudentClassroom} outline disabled={addingStudent}>Cancelar</Button>
                                <Button color="primary" onClick={addNewStudent} outline disabled={addingStudent}>
                                    {addingStudent ? 'Agregando...' : 'Agregar'}
                                </Button>
                    </ModalFooter>
                </ModalBody>
            </Modal>
            <Modal isOpen={showMessageModal} toggle={closeMessageModal} size="lg">
                <ModalBody>
                    <ModalHeader>
                        Enviar Mensaje
                    </ModalHeader>
                    <FormGroup className="d-flex gap-3 flex-column mt-4 mb-4">
                        <Label for="messageTextarea">Mensaje a enviar:</Label>
                        <Input
                            type="textarea"
                            id="messageTextarea"
                            placeholder="Mensaje"
                            name="messageText"
                            onChange={handleMessageTextChange}
                            value={messageText}
                            rows={6}
                            style={{ minHeight: '150px' }}
                        />
                        <small className="text-muted">
                            Variables disponibles: @firstName, {'{classroomName}'}, {'{subject}'}, {'{teacherFirstName}'}, {'{teacherLastName}'}, {'{materialPrice}'}
                        </small>
                    </FormGroup>
                    <ModalFooter>
                        <Button color="danger" onClick={closeMessageModal} outline>Cancelar</Button>
                        <Button color="secondary" onClick={resetMessageToDefault} outline>Restaurar Mensaje Original</Button>
                        <Button color="primary" onClick={sendMessageFromModal} outline>Enviar</Button>
                    </ModalFooter>
                </ModalBody>
            </Modal>
        </Container>
    );
};

export default ClassroomsList;
