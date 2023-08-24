import React, {ChangeEvent, useEffect, useMemo} from 'react';
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
    Modal
} from "reactstrap";
import {docId, docName, firebaseStoreDB} from "./utils/firebase";
import {collection, getDoc, updateDoc, doc, addDoc, onSnapshot} from 'firebase/firestore';
import _ from 'lodash';
import * as io from "socket.io-client";
import {onSocketOnce, PROD_SOCKET_URL} from "./utils/socket.io";
import {ToastContainer, toast} from 'react-toastify';
import {IWhatsappMessage, sendWhatsappMessage, startWhatsappServices} from "./services/whatsapp";

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
    id: number;
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

function App() {
    const [newStudent, setNewStudent] = React.useState<IStudent>();
    const [removeStudentId, setRemoveStudentId] = React.useState<number>();
    const [enableAdminView, setEnableAdminView] = React.useState<boolean>(false);
    const [logged, setLogged] = React.useState<boolean>(false);
    const [classStructure, setClassStructure] = React.useState<IClassStructure>({
        students: [],
        classes: 10,
        givenClasses: 6,
        evaluation: {
            test: 75,
            exposition: 5,
            participation: 20,
        }
    } as IClassStructure);
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
        // login('wpadilla');
        return () => {
            unsubscribe();
        }
    }, [])


    const login = async (sessionId: string) => {
        const response: any = await (await startWhatsappServices(true, sessionId)).json();
        console.log('response', response);
        const {status} = response;
        toast(`Whatsapp is ${status}`);
        setLogged(status === 'logged')
    }

    const [socket, setSocket] = React.useState<io.Socket>();

    React.useEffect(() => {
        if (!socket) {
            setSocket(io.connect(PROD_SOCKET_URL));
        }
    }, [])


    const handleWhatsappMessaging = (sent: (contact: IStudent) => any, end: (contacts: IStudent[]) => any) => {
        if (socket) {
            onSocketOnce(socket, 'ws-message-sent', sent);
            onSocketOnce(socket, 'ws-messages-end', end);
        }
    }

    const onMessageSent = (contact: IStudent) => {
        console.log('contact', contact)
        toast(`Mensaje enviado a ${contact.firstName}`);
    }

    const onMessageEnd = (contacts: IStudent[]) => {
        toast('¡Mensajes Enviados con Exito!', {type: 'success'});
    }

    React.useEffect(() => {
        handleWhatsappMessaging(onMessageSent, onMessageEnd);
    }, [logged]);


    const handleStudentEvaluation = (student: IStudent, type: 'participation' | 'test' | 'exposition', isSubstraction?: boolean) => () => {
        const points = type === 'participation' ? 1 : 3;
        const newClassStructure = {
            ...classStructure,
            students: classStructure.students.map(s => {
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
            participation: student.evaluation.participation < mustHaveParticipation,
            exposition: student.evaluation.exposition < mustHaveExposition,
            test: student.evaluation.test < mustHaveTest,
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
            students: [...classStructure.students, newStudentData]
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

    const sendMessage = async (contacts: IStudent[], message: IWhatsappMessage) =>
        await sendWhatsappMessage('wpadilla', contacts, message)

    const sendEvaluationMessage = (selectedStudents: IStudent[]) => {
        return;
        Promise.all(selectedStudents.map(async s => {
            await sendMessage([s], {
                text: getEvaluationMsg(s),
            });
        })).then(() => {
            toast('Ya comenzaron a enviar los mensajes', {type: 'success'});
        });
    }

    const getEvaluationMsg = (student: IStudent) => {
        const {participation, test, exposition} = studentEvaluationEnable(student);
        const points = getStudentPoints(student);
        const msg = `Hola ${student.firstName}! ${participation ? 'Falta participacion' : test ? 'Faltan pruebas' : exposition ? 'Falta exposicion' : '¡Al dia!'} (${points} puntos)`;
        return msg;
    }

    return (
        <div className="App">
            <div className="app-header">
                <Button className="d-none" color="info" onClick={() => setEnableAdminView(!enableAdminView)}>Toggle</Button>
                {/*<Button color="info" onClick={() => sendEvaluationMessage(classStructure.students)}>Enviar Evaluacion a*/}
                {/*    todos</Button>*/}
                {/*<Button color="info" onClick={addClassStructure}>Add collection</Button>*/}

            </div>
            <ListGroup className="students-list">
                {
                    classStructure.students.map(student => {
                            const {participation, test} = studentEvaluationEnable(student);
                            const points = getStudentPoints(student);
                            return (
                                <ListGroupItem className="student-item" key={student.id}>
                                    <span><b>{student.firstName}</b> = {points} puntos</span>
                                    <div className="d-flex align-items-center flex-column gap-1">
                                        <b>Estado</b>
                                        <Badge
                                            color={!participation && !test ? "primary" : 'warning'}>
                                            {!participation && !test ? '¡Al dia!' : participation ? 'Falta participacion' : test ? 'Faltan pruebas' : ''}
                                        </Badge>
                                    </div>
                                    <div className="student-actions">
                                        <div className="student-action-item">
                                            <b>Participación</b>
                                            <div className="d-flex align-items-center gap-3">
                                                <Button disabled={!participation}
                                                        onClick={handleStudentEvaluation(student, 'participation')}>
                                                    +1
                                                </Button>
                                                <Button
                                                    onClick={handleStudentEvaluation(student, 'participation', true)}>
                                                    -1
                                                </Button>
                                            </div>
                                        </div>
                                        {enableAdminView && <div className="student-action-item">
                                            <b>Pruebas</b>
                                            <div className="d-flex align-items-center gap-3">

                                                <Button disabled={!test}
                                                        onClick={handleStudentEvaluation(student, 'test')}>
                                                    +3
                                                </Button>
                                                <Button
                                                    onClick={handleStudentEvaluation(student, 'test', true)}>
                                                    -3
                                                </Button>
                                            </div>
                                        </div>}

                                        {enableAdminView &&
                                            <>
                                                <div className="student-action-item">
                                                    <Button color="danger"
                                                            onClick={() => setRemoveStudentId(student.id)}>Eliminar</Button>
                                                </div>
                                                <div className="student-action-item">
                                                    <Button color="info" outline
                                                            onClick={() => sendEvaluationMessage([student])}>Enviar
                                                        Evaluacion</Button>
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
            <ToastContainer/>
        </div>
    );
}

export default App;
