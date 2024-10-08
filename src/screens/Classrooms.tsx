import ClassroomsList from "../components/ClassroomList";
import {addDoc, collection, doc, onSnapshot, getDocs, updateDoc} from "firebase/firestore";
import {classroomCollectionName, firebaseStoreDB} from "../utils/firebase";
import {IClassroom, StudentStatusTypes} from "../models/clasroomModel";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {toast} from "react-toastify";
import _, {debounce} from "lodash";
import {mockClassrooms} from "../data/mock";
import * as XLSX from 'xlsx';
import {saveAs} from 'file-saver';
import {Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Button} from "reactstrap";
import {useSearchParams} from "react-router-dom";

// Helper function to generate custom IDs
const generateCustomID = () => Math.random().toString(36).substr(2, 9);

const showSuccessUpdate = debounce(() => {
    toast('Actualización exitosa!', {type: 'success', position: 'bottom-right'})
}, 900);

export const debounceUpdate = _.debounce((changedClassroom: IClassroom) => {
    updateClassrooms(changedClassroom);
}, 900);

const updateClassrooms = async (data: IClassroom) => {
    const docRef = doc(firebaseStoreDB, classroomCollectionName, data.id);
    await updateDoc(docRef, data as any);
    showSuccessUpdate();
}

const createNewClassroom = async () => {
    const newClassroom = {
        subject: "Nueva Materia",
        teacher: {
            id: generateCustomID(),
            firstName: "Nombre del Maestro",
            lastName: "Apellido del Maestro",
            phone: "", // No phone number initially
            role: "teacher"
        },
        students: [], // No students initially
        classes: [], // No class schedule initially
        materialPrice: 0 // No material price initially
    };

    try {
        await addDoc(collection(firebaseStoreDB, classroomCollectionName), newClassroom);
        toast('Nueva clase creada con éxito!', {type: 'success', position: 'bottom-right'});
    } catch (error) {
        console.error("Error al crear la nueva clase:", error);
        toast('Error al crear la clase', {type: 'error', position: 'bottom-right'});
    }
};

export const Classrooms = () => {
    const [classroomsData, setClassrooms] = useState<IClassroom[]>([]);
    const [loading, setLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
    const [searchParams] = useSearchParams();
    const isAdmin = useMemo(() => {
        return searchParams.get('admin') === '123456';
    }, [searchParams]);

    const getClassrooms = async () => {
        setLoading(true);
        const collectionRef = collection(firebaseStoreDB, classroomCollectionName);
        const querySnapshot = await getDocs(collectionRef);

        updateClassroom(querySnapshot as any);
        setLoading(false);
    };

    const updateClassroom = (querySnapshot: any) => {
        const documents: IClassroom[] = [];
        querySnapshot.forEach((doc: any) => {
            documents.push({id: doc.id, ...doc.data()} as IClassroom);
        });
        if (JSON.stringify(documents) !== JSON.stringify(classroomsData)) {
            setClassrooms(documents);
        }
    };

    useEffect(() => {
        getClassrooms();
        return () => {
            unsubscribe();
        }
    }, []);

    const unsubscribe = useMemo(() => {
        const collectionRef = collection(firebaseStoreDB, classroomCollectionName);
        return onSnapshot(collectionRef, (docSnapshot) => {
            // updateClassroom(docSnapshot as any);
        }, (error) => {
            console.error('Error listening to document:', error);
        });
    }, [classroomsData]);

    const exportToExcel = (status: StudentStatusTypes | 'all' = 'all', classroomId?: string) => {
        const filteredStudents = classroomsData
            .filter(classroom => !classroomId || classroom.id === classroomId)
            .flatMap(classroom =>
                classroom.students.filter(student => status === 'all' || student.status === status).map(student => ({
                    Materia: classroom.subject,
                    Nombre: `${student.firstName} ${student.lastName || ''}`,
                    Telefono: student.phone,
                    Estado: student.status,
                    Maestro: `${classroom.teacher.firstName || ''} ${classroom.teacher.lastName || ''}`
                }))
            );
        const selectedClassroom = classroomsData.find(classroom => classroom.id === classroomId);

        const worksheet = XLSX.utils.json_to_sheet(filteredStudents);
        const workbook = XLSX.utils.book_new();
        const sheetName = classroomId ? `students_${status}_${selectedClassroom?.subject?.replace(/[ ]/gi, '-')?.toLowerCase() || classroomId || ''}` : `students_${status}`;
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

        XLSX.writeFile(workbook, `${sheetName}.xlsx`);
    };

    const exportToText = (status: StudentStatusTypes | 'all' = 'all', classroomId?: string) => {
        const filteredStudents = classroomsData
            .filter(classroom => !classroomId || classroom.id === classroomId)
            .flatMap(classroom =>
                classroom.students.filter(student => status === 'all' || student.status === status).map(student => (
                    `Materia: ${classroom.subject}, Nombre: ${student.firstName} ${student.lastName || ''}, ` +
                    `Telefono: ${student.phone}, Estado: ${student.status}`
                ))
            ).join('\n');

        const blob = new Blob([filteredStudents], {type: "text/plain;charset=utf-8"});
        const fileName = classroomId ? `students_${status}_${classroomId}` : `students_${status}`;
        saveAs(blob, `${fileName}.txt`);
    };

    const handleExport = (format: 'excel' | 'text', status: StudentStatusTypes | 'all' = 'all', classroomId?: string) => {
        if (format === 'excel') {
            exportToExcel(status, classroomId);
        } else {
            exportToText(status, classroomId);
        }
    };

    return (
        <div>
            {
                loading &&
                <div
                    className="position-fixed opacity-75 z-3 w-100 h-100 top-0 left-0 bg-dark d-flex align-items-center justify-content-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            }

            {isAdmin && <div className="p-3">
                <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
                    <DropdownToggle color="primary" caret>
                        Export All Classrooms
                    </DropdownToggle>
                    <DropdownMenu>
                        <DropdownItem header>Excel</DropdownItem>
                        <DropdownItem onClick={() => handleExport('excel')}>Todos</DropdownItem>
                        <DropdownItem onClick={() => handleExport('excel', 'approved')}>Approved</DropdownItem>
                        <DropdownItem onClick={() => handleExport('excel', 'outstanding')}>Outstanding</DropdownItem>
                        <DropdownItem onClick={() => handleExport('excel', 'failed')}>Failed</DropdownItem>
                    </DropdownMenu>
                </Dropdown>

                <Button color="success" className="mt-3" onClick={createNewClassroom}>
                    Crear Nueva Clase
                </Button>
            </div>}


            <ClassroomsList exportClassroom={handleExport} updateClassrooms={updateClassrooms} classrooms={classroomsData}/>
        </div>
    );
};
