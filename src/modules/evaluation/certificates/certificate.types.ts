export interface CertificateData {
  id: string;
  classroomName: string;
  subjectName: string;
  completionText: string;
  studentName: string;
  teacherName: string;
}

export interface CertificateRenderOptions {
  format?: 'png' | 'jpeg';
  quality?: number;
}

export interface CertificatePdfPage {
  id: string;
  imageSrc: string;
}
