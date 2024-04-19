import ClassroomsList from "../components/ClassroomList";
import {addDoc, collection, doc, onSnapshot, getDocs, updateDoc} from "firebase/firestore";
import {classroomCollectionName, firebaseStoreDB} from "../utils/firebase";
import {IClassroom} from "../models/clasroomModel";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {toast} from "react-toastify";
import _, {debounce} from "lodash";
import {mockClassrooms} from "../data/mock";


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
            {/*<button onClick={addAllDocs}>add new</button>*/}
            <ClassroomsList updateClassrooms={updateClassrooms} classrooms={classroomsData}/>
        </div>
    )
}