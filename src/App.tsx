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
        login('wpadilla');
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
        const points = type === 'test' ? 3 : type === 'exposition' ? 5 : 1;
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

    const onChangeClassStructure = ({target: {type, value, name}}: ChangeEvent<HTMLInputElement>) => {
        const val = type === 'number' ? parseInt(value) : value;
        setClassStructure({
            ...classStructure,
            [name]: val,
        } as IClassStructure);
    }

    const sendMessage = async (contacts: IStudent[], message: IWhatsappMessage) =>
        await sendWhatsappMessage('wpadilla', contacts, message)

    const sendEvaluationMessage = (selectedStudents: IStudent[]) => {
        Promise.all(selectedStudents.map(async s => {
            await sendMessage([s], {
                text: getEvaluationMsg(s),
            });
        })).then(() => {
            toast('Ya comenzaron a enviar los mensajes', {type: 'success'});
        });
    }

    const getEvaluationMsg = (student: IStudent) => {
        const {incompleteParticipation, incompleteTests, mustHaveParticipation, mustHaveTest} = studentEvaluationEnable(student);
        const points = getStudentPoints(student);
        const participationUpdated = incompleteParticipation ? `_(Deberias tener ${mustHaveParticipation} para estar en 100 💯🔥)_.` : ''
        const testsUpdated = incompleteTests ? `_(Deberias tener ${mustHaveTest} puntos para estar en 100 💯🔥)_.` : '';

        let lastMessage = !incompleteParticipation && !incompleteTests ? '*_¡Felicidades estas al dia!_* 💯🔥' : '_Recuerda participar y llenar siempre las pruebas para que estes al dia_';
        let initialMsg = `Hola ${student.firstName}, Dios te bendiga 🙌🏻 este es el resumen de tu evaluacion de las clases de SEAN.`
        if(hasEnded) {
            initialMsg = `Hola ${student.firstName}, Dios te bendiga 🙌🏻 ¡Felicidades, ya terminamos SEAN! 🥳 este es el resumen de tu puntuacion.`
            const perfectPuntuation = !incompleteParticipation && !incompleteTests;
            if(perfectPuntuation) {
                lastMessage = `Te felicito ${student.firstName} 🥳, eres de los pocos estudiantes que obtuvo la *Puntuación Perfecta* 💯 le pido a Dios que siga colocando sabiduria y disposición en ti 🙏🏻, seguro que Dios esta muy orgulloso de lo que has logrado 🙌🏻 ha sido un honor ser tu Maestro durante este tiempo y espero seguir viendote crecer en Dios. Te reto a que sigas con mas fuerza y entusiasmo estudiando la vida de Jesús, no retrocedas sino que entregate aun más ❤️‍🔥, espero que disfutes la lectura de tu nuevo libro y que sigas imitando los pasos de nuestro *Salvador* ✝️❤️‍🔥
                
_Y ahora, que toda la gloria sea para Dios, quien puede lograr mucho más de lo que pudiéramos pedir o incluso imaginar mediante su gran poder, que actúa en nosotros._
Efesios 3:20`
            } else if(points < 100 && points >= 90) {
                lastMessage = `Has hecho un excelente trabajo ${student.firstName}, tu esfuerzo y disposicion para completar esta etapa de aprendizaje a dado sus frutos ?? tuviste una nota muy buena pero no te conformes, entregate mas en el proximo nivel hasta alcanzar la *Puntuacion Perfecta* 💯 y lo mas importante procura seguir imitando y conociendo a Jesús, Dios esta haciendo grandes cosas en tu vida`
            } else if (points < 90 && points >= 80) {

            } else if (points < 80) {

            }
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
    const onChangeAdminCode =  ({target: {value}}: ChangeEvent<HTMLInputElement>) => setAdminCode(value);

    const handleAdminView = () => {
        if(adminCode === '15282118') {
            setEnableAdminView(!enableAdminView);
        } else if(enableAdminView) {
            setEnableAdminView(false);
        }
    }

    return (
        <div className="App">
            <div className="app-header">
                <FormGroup className="d-flex align-items-center gap-2">
                    {!enableAdminView && <Input type="number" onChange={onChangeAdminCode}/>}
                    <Button color={enableAdminView ? 'danger' : "info"} className="text-nowrap" onClick={handleAdminView}>{enableAdminView ? 'Desactivar' : 'Activar'} Admin</Button>
                </FormGroup>
                {enableAdminView && <Button color="info">Enviar Evaluacion a
                    todos</Button>}
                {/*<Button color="info" onClick={addClassStructure}>Add collection</Button>*/}

                { enableAdminView && <FormGroup>
                    <Label>Clase actual</Label>
                    <Input type="number" name="givenClasses" value={classStructure.givenClasses}
                           onChange={onChangeClassStructure}/>
                </FormGroup>}
            </div>
            <ListGroup className="students-list">
                {
                    classStructure.students.map(student => {
                            const {incompleteParticipation, incompleteTests, incompleteExposition} = studentEvaluationEnable(student);
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
            <ToastContainer/>
        </div>
    );
}

export default App;
