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
import {Dropdown, DropdownToggle, DropdownMenu, DropdownItem} from "reactstrap";


// const docRef = doc(firebaseStoreDB, classroomCollectionName, classroomsDocId);
const showSuccessUpdate = debounce(() => {
    toast('Actualizacion Exitosa!', {type: 'success', position: 'bottom-right'})
}, 900);



export const debounceUpdate = _.debounce((changedClassroom: IClassroom) => {
    updateClassrooms(changedClassroom);
}, 900);

const updateClassrooms = async (data: IClassroom) => {
    const docRef = doc(firebaseStoreDB, classroomCollectionName, data.id);
    await updateDoc(docRef, data as any);
    showSuccessUpdate();
}
export const Classrooms = () => {
    const [classroomsData, setClassrooms] = useState<IClassroom[]>([]);
    const [loading, setLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    const getClassrooms = async () => {
        setLoading(true);
        const collectionRef = collection(firebaseStoreDB, classroomCollectionName);
        const querySnapshot = await getDocs(collectionRef);
        // const data = await res.data()

        updateClassroom(querySnapshot as any);
        // const documents: IClassroom[] = [];
        //
        // // Iterate over the query snapshot and push document data into the array
        // querySnapshot.forEach((doc) => {
        //     documents.push({ id: doc.id, ...doc.data() } as IClassroom);
        // });
        //
        //
        // setClassrooms(documents);
        setLoading(false);
    }

    const updateClassroom = (querySnapshot: any) => {
        const documents: IClassroom[] = [];
        // Iterate over the query snapshot and push document data into the array
        querySnapshot.forEach((doc: any) => {
            documents.push({id: doc.id, ...doc.data()} as IClassroom);
        });
        if (JSON.stringify(documents) !== JSON.stringify(classroomsData)) {
            setClassrooms(documents);
        }
    }

    useEffect(() => {
        getClassrooms();
        return () => {
            unsubscribe();
        }
    }, [])


    const unsubscribe =
        useMemo(() => {
                const collectionRef = collection(firebaseStoreDB, classroomCollectionName);
                return onSnapshot(collectionRef, (docSnapshot) => {
                    // updateClassroom(docSnapshot as any);
                }, (error) => {
                    console.error('Error listening to document:', error);
                })
            }
            , [classroomsData]);

    const addAllDocs = async () => {
        const collectionRef = collection(firebaseStoreDB, classroomCollectionName);
        setLoading(true);
        await Promise.all([mockClassrooms().data[0]].map(async item => {
            delete (item as any).id;
            // const res = await addDoc(collectionRef, item);
        }))
        setLoading(false);
    }

    const exportToExcel = (status: StudentStatusTypes) => {
        const filteredStudents = classroomsData.flatMap(classroom =>
            classroom.students.filter(student => student.status === status).map(student => ({
                Materia: classroom.subject,
                Nombre: `${student.firstName} ${student.lastName || ''}`,
                Telefono: student.phone,
                Estado: student.status,
                Maestro: `${classroom.teacher.firstName || ''} ${classroom.teacher.lastName || ''}`
            }))
        );

        const worksheet = XLSX.utils.json_to_sheet(filteredStudents);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

        XLSX.writeFile(workbook, `students_${status}.xlsx`);
    };

    const exportToText = (status: StudentStatusTypes) => {
        const filteredStudents = classroomsData.flatMap(classroom =>
            classroom.students.filter(student => student.status === status).map(student => (
                `Materia: ${classroom.subject}, Nombre: ${student.firstName} ${student.lastName || ''}, ` +
                `Telefono: ${student.phone}, Estado: ${student.status}`
            ))
        ).join('\n');

        const blob = new Blob([filteredStudents], {type: "text/plain;charset=utf-8"});
        saveAs(blob, `students_${status}.txt`);
    };


    const handleExport = (format: 'excel' | 'text', status: StudentStatusTypes) => {
        if (format === 'excel') {
            exportToExcel(status);
        } else {
            exportToText(status);
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


            <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
                <DropdownToggle caret>
                    Export Classrooms
                </DropdownToggle>
                <DropdownMenu>
                    <DropdownItem header>Excel</DropdownItem>
                    <DropdownItem onClick={() => handleExport('excel', 'approved')}>Approved</DropdownItem>
                    <DropdownItem onClick={() => handleExport('excel', 'outstanding')}>Outstanding</DropdownItem>
                    <DropdownItem onClick={() => handleExport('excel', 'failed')}>Failed</DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem header>Text</DropdownItem>
                    <DropdownItem onClick={() => handleExport('text', 'approved')}>Approved</DropdownItem>
                    <DropdownItem onClick={() => handleExport('text', 'outstanding')}>Outstanding</DropdownItem>
                    <DropdownItem onClick={() => handleExport('text', 'failed')}>Failed</DropdownItem>
                </DropdownMenu>
            </Dropdown>
            {/*<button onClick={addAllDocs}>add new</button>*/}
            <ClassroomsList updateClassrooms={updateClassrooms} classrooms={classroomsData}/>
        </div>
    )
}