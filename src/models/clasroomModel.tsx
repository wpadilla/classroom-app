export interface IUser {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    role:'teacher'|'student'|'admin'|'coordinator';
}

export interface IClasses {
    id: string;
    name: string;
    date: Date;
}

export interface IEvaluation {
    test: number;
    exposition: number;
    participation: number;
    assistance: IClasses[];
}

export type StudentStatusTypes = 'approved' | 'failed' | 'outstanding'
export interface IStudent extends IUser {
    evaluation: IEvaluation;
    role: 'student';
    status?: StudentStatusTypes;
    assistance: IClasses[];
}

export interface IClassroom {
    id: string;
    teacher: IUser;
    students: IStudent[];
    subject: string;
    classes: IClasses[];
    currentClass?: IClasses;
    materialPrice: number;
    name?: string;
}


export const studentStatusList: StudentStatusTypes[] = ['approved', 'failed', 'outstanding'] ;

export const studentStatusNames: { [key in StudentStatusTypes]: string } = {
    failed: 'Reprobado',
    approved: 'Aprobado',
    outstanding: 'Sobresaliente'
}