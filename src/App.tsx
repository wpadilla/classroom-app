import React, {ChangeEvent, useEffect, useMemo, useState} from 'react';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import {
    Badge,
    Button,
    Form,
    FormGroup,
    Input,
    Label,
    ListGroup,
    ListGroupItem,
    ModalBody, ModalFooter,
    ModalHeader,
    Modal, DropdownToggle, DropdownMenu, DropdownItem, Dropdown
} from "reactstrap";
import {docId, docName, firebaseStoreDB} from "./utils/firebase";
import {collection, getDoc, updateDoc, doc, addDoc, onSnapshot} from 'firebase/firestore';
import _ from 'lodash';
import * as io from "socket.io-client";
import {onSocketOnce, PROD_SOCKET_URL} from "./utils/socket.io";
import {ToastContainer, toast} from 'react-toastify';
import {IWhatsappMessage, sendWhatsappMessage, startWhatsappServices} from "./services/whatsapp";
import {useSearchParams} from "react-router-dom";
import * as XLSX from 'xlsx';
import {saveAs} from 'file-saver';

export interface IEvaluation {
    test: number;
    exposition: number;
    participation: number;
}

export interface IClassStructure {
    students: IStudent[];
    classes: number;
    givenClasses: number;
    evaluation: IEvaluation;
}

export interface IStudent {
    id: any;
    firstName: string;
    lastName?: string;
    phone: string;
    evaluation: IEvaluation;
}


const docRef = doc(firebaseStoreDB, docName, docId);

const updateClassStructure =
    _.debounce(async (data: IClassStructure) => {
        const res = await updateDoc(docRef, data as any);
    }, 900)

const initialClassStructure = {
    students: [],
    classes: 10,
    givenClasses: 6,
    evaluation: {
        test: 75,
        exposition: 5,
        participation: 20,
    }
} as IClassStructure;

function App() {
    const [newStudent, setNewStudent] = React.useState<IStudent>();
    const [removeStudentId, setRemoveStudentId] = React.useState<number>();
    const [enableAdminView, setEnableAdminView] = React.useState<boolean>(false);
    const [classStructure, setClassStructure] = React.useState<IClassStructure>(initialClassStructure);
    const [oldClassStructure, setOldClassStructure] = React.useState<IClassStructure>({
        students: [],
        classes: 10,
        givenClasses: 6,
        evaluation: {
            test: 75,
            exposition: 5,
            participation: 20,
        }
    } as IClassStructure);
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);


    const hasEnded = useMemo(() => classStructure.givenClasses >= classStructure.classes, [classStructure.givenClasses, classStructure.classes]);

    // const [classStructureDoc, setClassStructureDoc] = React.useState<any>();

    const unsubscribe =
        useMemo(() =>
                onSnapshot(docRef, (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        // Document data exists
                        const data = docSnapshot.data();
                        if (JSON.stringify(data) !== JSON.stringify(classStructure)) {
                            setOldClassStructure(data as any);
                            setClassStructure(data as any);
                        }
                    } else {
                    }
                }, (error) => {
                    console.error('Error listening to document:', error);
                })
            , [oldClassStructure]);


    const getClassStructure = async () => {
        const res = await getDoc(docRef);
        const data = await res.data() as IClassStructure;
        setOldClassStructure(data);
        setClassStructure(data);
        // setClassStructureDoc(res as any);
    }

    const addClassStructure = async () => {
        const collectionRef = collection(firebaseStoreDB, docName);
        const res = await addDoc(collectionRef, classStructure);
    };


    useEffect(() => {
        if (JSON.stringify(classStructure) !== JSON.stringify(oldClassStructure)) {
            updateClassStructure(classStructure);
        }
    }, [classStructure, oldClassStructure])


    useEffect(() => {
        getClassStructure();
        return () => {
            unsubscribe();
        }
    }, [])

    const onMessageSent = (contact: IStudent) => {
        console.log('contact', contact)
        toast(`Mensaje enviado a ${contact.firstName}`);
    }

    const onMessageEnd = (contacts: IStudent[]) => {
        toast('¡Mensajes Enviados con Exito!', {type: 'success'});
    }

    const handleStudentEvaluation = (student: IStudent, type: 'participation' | 'test' | 'exposition', isSubstraction?: boolean) => () => {
        const points = type === 'test' ? 3 : type === 'exposition' ? 5 : 1;
        const newClassStructure = {
            ...classStructure,
            students: classStructure?.students?.map(s => {
                if (s.id === student.id) {
                    return {
                        ...s,
                        evaluation: {
                            ...s.evaluation,
                            [type]: isSubstraction ? s.evaluation[type] - points : s.evaluation[type] + points,
                        }
                    }
                }
                return s;
            }),
        };
        setClassStructure(newClassStructure);
    };

    const resetStudentEvaluation = (student: IStudent) => () => {
        const newClassStructure = {
            ...classStructure,
            students: classStructure?.students?.map(s => {
                if (s.id === student.id) {
                    return {
                        ...s,
                        evaluation: {
                            participation: 0,
                            exposition: 0,
                            test: 0,
                        }
                    }
                }
                return s;
            }),
        };
        setClassStructure(newClassStructure);
    };
    const getStudentPoints = (student: IStudent) => {
        return student.evaluation.test + student.evaluation.exposition + student.evaluation.participation;
    }
    const studentEvaluationEnable = (student: IStudent) => {
        const {participation, exposition, test} = classStructure.evaluation;
        const {givenClasses} = classStructure;
        const classProgressPercentage = givenClasses * 100 / classStructure.classes

        const mustHaveParticipation = participation * classProgressPercentage / 100;
        const mustHaveExposition = exposition * classProgressPercentage / 100;
        const mustHaveTest = test * classProgressPercentage / 100

        const res = {
            mustHaveParticipation,
            mustHaveExposition,
            mustHaveTest,
            incompleteParticipation: student.evaluation.participation < mustHaveParticipation,
            incompleteExposition: student.evaluation.exposition < mustHaveExposition,
            incompleteTests: student.evaluation.test < mustHaveTest,
        };
        return res;
    };

    const addStudent = (e: any) => {
        e.preventDefault();
        const newStudentData = {
            id: Date.now(),
            evaluation: {
                test: 0,
                exposition: 0,
                participation: 0,
            },
            ...newStudent,
        } as IStudent;

        setClassStructure({
            ...classStructure,
            students: [...(classStructure?.students || []), newStudentData]
        })
    }

    const removeStudent = (id: number) => () => {
        setClassStructure({
            ...classStructure,
            students: classStructure.students.filter(s => s.id !== id)
        });
        setRemoveStudentId(undefined)
    }

    const onChangeStudent = ({target: {value, name}}: ChangeEvent<HTMLInputElement>) => {
        setNewStudent({
            ...newStudent,
            [name]: value,
        } as IStudent);
    }

    const onChangeClassStructure = ({target: {type, value, name}}: ChangeEvent<HTMLInputElement>) => {
        const val = type === 'number' ? parseInt(value) : value;
        setClassStructure({
            ...classStructure,
            [name]: val,
        } as IClassStructure);
    }

    const sendMessage = async (contacts: IStudent[], message: IWhatsappMessage) => {
        contacts = contacts.map(item => ({
            ...item,
            id: `${item.phone}@s.whatsapp.net`
        })) as IStudent[];

        const formData = new FormData();
        const messages = Array.isArray(message) ? message : [message];

        formData.append('messages', JSON.stringify(messages));
        formData.append('contacts', JSON.stringify(contacts));
        formData.append('sessionId', 'bibleAssistant');

        await sendWhatsappMessage('bibleAssistant', formData);
        // await sendWhatsappMessage('bibleAssistant', contacts, message)
    }

    const sendEvaluationMessage = (selectedStudents: IStudent[]) => {
        Promise.all(selectedStudents?.map(async s => {
            await sendMessage([s], {
                text: getEvaluationMsg(s),
            });
        })).then(() => {
            toast('Ya comenzaron a enviar los mensajes', {type: 'success'});
        });
    }

    const getEvaluationMsg = (student: IStudent) => {

        const {
            incompleteParticipation,
            incompleteTests,
            mustHaveParticipation,
            mustHaveTest
        } = studentEvaluationEnable(student);
        const points = getStudentPoints(student);
        const participationUpdated = incompleteParticipation ? `_(Deberias tener ${mustHaveParticipation} para estar en 100 💯🔥)_.` : ''
        const testsUpdated = incompleteTests ? `_(Deberias tener ${mustHaveTest} puntos para estar en 100 💯🔥)_.` : '';

        let lastMessage = !incompleteParticipation && !incompleteTests ? '*_¡Felicidades estas al dia!_* 💯🔥' : '_Recuerda participar y llenar siempre las pruebas para que estes al dia_';
        let initialMsg = `Hola ${student.firstName}, Dios te bendiga 🙌🏻 este es el resumen de tu evaluacion de las clases de SEAN.`
        if (hasEnded) {
            initialMsg = `Hola ${student.firstName}, Dios te bendiga 🙌🏻 ¡Ya terminamos SEAN 1! 🥳 este es el resumen de tu puntuación.`
            const perfectPuntuation = !incompleteParticipation && !incompleteTests;
            const byeMessage = `Ha sido un honor ser tu Maestro durante este tiempo y espero seguir viendote crecer en Dios 🙏🏻❤️

_Y ahora, que toda la gloria sea para Dios, quien puede lograr mucho más de lo que pudiéramos pedir o incluso imaginar mediante su gran poder, que actúa en nosotros._
Efesios 3:20`
            if (perfectPuntuation) {
                lastMessage = `Te felicito ${student.firstName}, pasaste a SEAN 2 🥳, eres de los pocos estudiantes que obtuvo la *Puntuación Perfecta* 💯 le pido a Dios que siga colocando sabiduria y disposición en ti 🙏🏻, seguro que Dios esta muy orgulloso de lo que has logrado 🙌🏻 te reto a que sigas con mas fuerza y entusiasmo estudiando la vida de Jesús, no retrocedas sino que entregate aun más ❤️‍🔥, espero que disfutes la lectura de tu nuevo libro y que sigas imitando los pasos de nuestro *Salvador* ✝️❤️‍🔥`
            } else if (points < 100 && points >= 90) {
                lastMessage = `Te felicito ${student.firstName}, pasaste a SEAN 2 🥳 has hecho un excelente trabajo, tu esfuerzo y disposicion para completar esta etapa de aprendizaje han dado sus frutos, tuviste una nota muy buena pero no te conformes, entregate mas en el proximo nivel hasta alcanzar los 100 puntos (*La Puntuación Perfecta* 💯) y lo mas importante procura seguir imitando y conociendo a Jesús, Dios esta haciendo grandes cosas en tu vida 🙌🙌🙌🙌`
            } else if (points < 90 && points >= 80) {
                lastMessage = `Te felicito ${student.firstName}, pasaste a SEAN 2 🥳 hiciste un buen trabajo pero sé que puedes dar más 🔥, no te conformes con una calificación de _${points} puntos_ en tu proxima clase de sean, Dios tiene cosas más grandes para tí ❤️ sigue aprendiendo más de Jesús 🙌🙌🙌🙌`
            } else if (points < 80) {
                lastMessage = ` ${student.firstName} Hiciste un buen trabajo en SEAN 1 🙌, pero lamentablemente, no obtuviste los puntos suficientes para pasar a SEAN 2 😢, mi recomendación es que repitas con nosotros SEAN 1 ❤️ son solo 2 meses y te aseguro que serán de mucha bendición, no dejes que esto te desanime, sino todo lo contrario, usalo como un impulso para seguir adelante con más fuerza 💪 y conocer más de Jesus🙌`
            }
            lastMessage = `${lastMessage} 

${byeMessage}`;

        }

        const msg = `${initialMsg}

*Participacion:* ${student.evaluation.participation} puntos ${participationUpdated}
*Pruebas:* ${student.evaluation.test} puntos ${testsUpdated}
*Exposición:* ${student.evaluation.exposition ? student.evaluation.exposition + ' puntos' : 'Aun no has hecho una exposición 👀'} 
*Tienes un total de ${points} puntos.*

${lastMessage}`;
        return msg;
    }

    const [adminCode, setAdminCode] = useState<string>('');
    const onChangeAdminCode = ({target: {value}}: ChangeEvent<HTMLInputElement>) => setAdminCode(value);

    const handleAdminView = () => {
        if (adminCode === '123456') {
            setEnableAdminView(!enableAdminView);
        } else if (enableAdminView) {
            setEnableAdminView(false);
        }
    }

    const [searchParams, setSearchParams] = useSearchParams();
    useEffect(() => {
        setEnableAdminView(searchParams.get('admin') === '123456');
    }, [searchParams]);

    const exportToText = (status: 'approved' | 'failed' | 'outstanding') => {
        const filteredStudents = classStructure.students.filter(student => {
            const points = getStudentPoints(student);
            if (status === 'approved') return points >= 70 && points < 80;
            if (status === 'outstanding') return points >= 80;
            if (status === 'failed') return points < 70;
        });

        const textData = filteredStudents.map(student => (
            `Name: ${student.firstName} ${student.lastName || ''}, ` +
            `Phone: ${student.phone}, Points: ${getStudentPoints(student)}, Status: ${status}`
        )).join('\n');

        const blob = new Blob([textData], {type: "text/plain;charset=utf-8"});
        saveAs(blob, `students_${status}.txt`);
    };

    const exportToExcel = (status: 'approved' | 'failed' | 'outstanding') => {
        const filteredStudents = classStructure.students.filter(student => {
            const points = getStudentPoints(student);
            if (status === 'approved') return points >= 70 && points < 80;
            if (status === 'outstanding') return points >= 80;
            if (status === 'failed') return points < 70;
        });

        const data = filteredStudents.map(student => ({
            Name: `${student.firstName} ${student.lastName || ''}`,
            Phone: student.phone,
            Points: getStudentPoints(student),
            Status: status
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

        XLSX.writeFile(workbook, `students_${status}.xlsx`);
    };

    const handleExport = (format: 'excel' | 'text', status: 'approved' | 'failed' | 'outstanding') => {
        if (format === 'excel') {
            exportToExcel(status);
        } else {
            exportToText(status);
        }
    };


    return (
        <div className="App">
            <div className="app-header">
                <FormGroup className="d-flex align-items-center gap-2">
                    {!enableAdminView && <Input type="number" onChange={onChangeAdminCode}/>}
                    <Button color={enableAdminView ? 'danger' : "info"} className="text-nowrap"
                            onClick={handleAdminView}>{enableAdminView ? 'Desactivar' : 'Activar'} Admin</Button>
                </FormGroup>
                {enableAdminView && <Button color="info">Enviar Evaluacion a
                    todos</Button>}
                {/*<Button color="info" onClick={addClassStructure}>Add collection</Button>*/}

                {enableAdminView && <FormGroup>
                    <Label>Clase actual</Label>
                    <Input type="number" name="givenClasses" value={classStructure.givenClasses}
                           onChange={onChangeClassStructure}/>
                </FormGroup>}
            </div>
            <ListGroup className="students-list">
                {
                    classStructure?.students?.map(student => {
                            const {
                                incompleteParticipation,
                                incompleteTests,
                                incompleteExposition
                            } = studentEvaluationEnable(student);
                            const points = getStudentPoints(student);
                            return (
                                <ListGroupItem className="student-item" key={student.id}>
                                    <span><b>{student.firstName}</b> = {points} puntos</span>
                                    <div className="d-flex align-items-center flex-column gap-1">
                                        <b>Estado</b>
                                        <Badge
                                            color={!incompleteParticipation && !incompleteTests ? "primary" : 'warning'}>
                                            {!incompleteParticipation && !incompleteTests ? '¡Al dia!' : incompleteParticipation ? 'Falta participacion' : incompleteTests ? 'Faltan pruebas' : ''}
                                        </Badge>
                                    </div>
                                    <div className="student-actions">
                                        <div className="student-action-item">
                                            <b>Participación</b>
                                            <div className="d-flex align-items-center gap-3">
                                                <Button disabled={!incompleteParticipation}
                                                        onClick={handleStudentEvaluation(student, 'participation')}>
                                                    +1
                                                </Button>
                                                <Button
                                                    disabled={student.evaluation.participation <= 0}
                                                    onClick={handleStudentEvaluation(student, 'participation', true)}>
                                                    -1
                                                </Button>
                                            </div>
                                        </div>
                                        {enableAdminView && <div className="student-action-item">
                                            <b>Pruebas</b>
                                            <div className="d-flex align-items-center gap-3">

                                                <Button disabled={!incompleteTests}
                                                        onClick={handleStudentEvaluation(student, 'test')}>
                                                    +3
                                                </Button>
                                                <Button
                                                    disabled={student.evaluation.test <= 0}
                                                    onClick={handleStudentEvaluation(student, 'test', true)}>
                                                    -3
                                                </Button>
                                            </div>
                                        </div>}
                                        {enableAdminView && <div className="student-action-item">
                                            <b>Exposicion</b>
                                            <div className="d-flex align-items-center gap-3">

                                                <Button disabled={!incompleteExposition}
                                                        onClick={handleStudentEvaluation(student, 'exposition')}>
                                                    +5
                                                </Button>
                                                <Button disabled={incompleteExposition}
                                                        onClick={handleStudentEvaluation(student, 'exposition', true)}>
                                                    -5
                                                </Button>
                                            </div>
                                        </div>}

                                        {enableAdminView &&
                                            <>
                                                <div className="student-action-item">
                                                    <Button
                                                        onClick={resetStudentEvaluation(student)}>Reset</Button>
                                                </div>
                                                <div className="student-action-item">
                                                    <Button color="danger"
                                                            onClick={() => setRemoveStudentId(student.id)}>Eliminar</Button>
                                                </div>
                                                <div className="student-action-item">
                                                    <Button color="info" outline
                                                            onClick={() => sendEvaluationMessage([student])}>Enviar
                                                        E.</Button>
                                                </div>

                                            </>}

                                    </div>
                                </ListGroupItem>)

                        }
                    )
                }
            </ListGroup>

            {enableAdminView && <Form className="p-5" onSubmit={addStudent}>
                <FormGroup>
                    <Label for="firstName">Nombre</Label>
                    <Input name="firstName" id="firstName" onChange={onChangeStudent}/>
                </FormGroup>
                <FormGroup>
                    <Label for="lastName">Apellido</Label>
                    <Input name="lastName" id="lastName" onChange={onChangeStudent}/>
                </FormGroup>
                <FormGroup>
                    <Label for="phone">Whatsapp</Label>
                    <Input name="phone" id="phone" onChange={onChangeStudent}/>
                </FormGroup>
                <FormGroup>
                    <Button type="submit" color="primary" onClick={addStudent}>Agregar</Button>
                </FormGroup>
            </Form>}
            <Modal isOpen={!!removeStudentId} toggle={() => setRemoveStudentId(undefined)}>
                <ModalHeader toggle={() => setRemoveStudentId(undefined)}>Eliminar?</ModalHeader>
                <ModalBody>
                    Desea eliminar el estudiante?
                </ModalBody>

                <ModalFooter>
                    <Button color="primary" onClick={removeStudentId ? removeStudent(removeStudentId) : undefined}>
                        Eliminar
                    </Button>{' '}
                    <Button color="secondary" onClick={() => setRemoveStudentId(undefined)}>
                        Cancelar
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}

export default App;
