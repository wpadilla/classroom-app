// Classroom Resource Model for uploaded files

export interface IClassroomResource {
  id: string;
  name: string;
  url: string;
  type: string; // MIME type (e.g., 'application/pdf', 'image/png')
  size: number; // in bytes
  uploadedBy: string; // userId
  uploadedAt: Date;
}

export type IClassroomResourceCreate = Omit<IClassroomResource, 'id' | 'uploadedAt'>;
