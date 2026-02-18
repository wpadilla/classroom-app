import React, { useRef, useState } from 'react';
import { Alert, Badge, Button, FormGroup, Input, Spinner, Table } from 'reactstrap';
import { IUserDocument } from '../../models';
import { formatFileSize, getFileIcon, getFileTypeColor } from '../../utils/fileUtils';

interface UserDocumentsSectionProps {
  documents: IUserDocument[];
  canManage: boolean;
  uploading?: boolean;
  deletingId?: string | null;
  onUpload?: (file: File) => Promise<void> | void;
  onDelete?: (doc: IUserDocument) => Promise<void> | void;
  onRename?: (doc: IUserDocument) => Promise<void> | void;
  onDownload?: (doc: IUserDocument) => void;
}

const UserDocumentsSection: React.FC<UserDocumentsSectionProps> = ({
  documents,
  canManage,
  uploading = false,
  deletingId = null,
  onUpload,
  onDelete,
  onRename,
  onDownload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !onUpload) return;
    await onUpload(selectedFile);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = (doc: IUserDocument) => {
    if (onDownload) {
      onDownload(doc);
      return;
    }
    const link = document.createElement('a');
    link.href = doc.url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div>
      {canManage && (
        <div className="mb-4 p-3 bg-light rounded">
          <h6 className="mb-3">Subir Nuevo Documento</h6>
          <FormGroup>
            <Input
              innerRef={fileInputRef}
              type="file"
              onChange={handleSelectFile}
              disabled={uploading}
              accept="*/*"
            />
            <small className="text-muted">
              Puedes subir PDFs, documentos, imagenes, audios o videos.
            </small>
          </FormGroup>
          <Button
            color="primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Subiendo...
              </>
            ) : (
              <>
                <i className="bi bi-cloud-upload me-2"></i>
                Subir Documento
              </>
            )}
          </Button>
        </div>
      )}

      {documents.length === 0 ? (
        <Alert color="info">
          <i className="bi bi-info-circle me-2"></i>
          No hay documentos disponibles
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table hover>
            <thead className="table-light">
              <tr>
                <th style={{ width: '50px' }}></th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Tamano</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="text-center">
                    <i
                      className={`${getFileIcon(doc.type, doc.name)} fs-4`}
                      style={{ color: getFileTypeColor(doc.type) }}
                    ></i>
                  </td>
                  <td>
                    <div className="fw-bold">{doc.name}</div>
                    <small className="text-muted">
                      {new Date(doc.uploadedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </small>
                  </td>
                  <td>
                    <Badge color={getFileTypeColor(doc.type)}>
                      {doc.type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </Badge>
                  </td>
                  <td>{formatFileSize(doc.size)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        color="success"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                      >
                        <i className="bi bi-download"></i>
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            color="secondary"
                            size="sm"
                            onClick={() => onRename?.(doc)}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            color="danger"
                            size="sm"
                            onClick={() => onDelete?.(doc)}
                            disabled={deletingId === doc.id}
                          >
                            {deletingId === doc.id ? (
                              <Spinner size="sm" />
                            ) : (
                              <i className="bi bi-trash"></i>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default UserDocumentsSection;
