import React from 'react';
import { IUserDocument } from '../../../../models';
import UserDocumentsSection from '../../../../components/user-documents/UserDocumentsSection';

interface DocumentsTabProps {
  documents: IUserDocument[];
  canManage: boolean;
  uploading: boolean;
  deletingId: string | null;
  onUpload: (file: File) => Promise<void> | void;
  onDelete: (doc: IUserDocument) => Promise<void> | void;
  onRename: (doc: IUserDocument) => Promise<void> | void;
  onDownload: (doc: IUserDocument) => void;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  canManage,
  uploading,
  deletingId,
  onUpload,
  onDelete,
  onRename,
  onDownload,
}) => {
  return (
    <UserDocumentsSection
      documents={documents}
      canManage={canManage}
      uploading={uploading}
      deletingId={deletingId}
      onUpload={onUpload}
      onDelete={onDelete}
      onRename={onRename}
      onDownload={onDownload}
    />
  );
};

export default DocumentsTab;
