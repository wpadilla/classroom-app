import ClassroomsList from "../components/ClassroomList";
import {addDoc, collection, doc, getDoc, onSnapshot, getDocs, updateDoc} from "firebase/firestore";
import {classroomCollectionName, classroomsDocId, firebaseStoreDB} from "../utils/firebase";
import _ from "lodash";
import {IClassroom} from "../models/clasroomModel";
import React, {useEffect, useMemo, useState} from "react";
import {mockClassrooms} from "../data/mock";


// const docRef = doc(firebaseStoreDB, classroomCollectionName, classroomsDocId);

const updateClassrooms =
    _.debounce(async (data: IClassroom) => {
        const docRef = doc(firebaseStoreDB, classroomCollectionName, data.id);
        await updateDoc(docRef, data as any);
    }, 900)

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
                    updateClassroom(docSnapshot as any);
                }, (error) => {
                    console.error('Error listening to document:', error);
                })
            }
            , [classroomsData]);

    const addAllDocs = async () => {
        // const collectionRef = collection(firebaseStoreDB, classroomCollectionName);
        // setLoading(true);
        // await Promise.all(mockClassrooms().data.map(async item => {
        //     delete (item as any).id;
        //     const res = await addDoc(collectionRef, item);
        // }))
        // setLoading(false);
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
            <ClassroomsList updateClassrooms={updateClassrooms} classrooms={classroomsData}/>
        </div>
    )
}