import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
    <div className="space-y-6">
      {/* Upload Dropzone Area */}
      {canManage && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-3xl p-5 text-center relative hover:bg-gray-100 transition-colors group">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleSelectFile}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            accept="*/*"
          />
          <div className="flex flex-col items-center justify-center gap-3">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform ${selectedFile ? 'text-blue-600' : 'text-gray-400'}`}>
              <i className={`bi ${selectedFile ? 'bi-file-earmark-check-fill' : 'bi-cloud-arrow-up-fill'} text-2xl`} />
            </div>
            <div>
              <h6 className="font-bold text-gray-900 text-sm mb-1">
                {selectedFile ? selectedFile.name : 'Subir Nuevo Documento'}
              </h6>
              <p className="text-xs text-gray-500 m-0 max-w-xs mx-auto">
                {selectedFile 
                  ? formatFileSize(selectedFile.size)
                  : 'Toca o arrastra para subir PDFs, imágenes, o comprobantes.'}
              </p>
            </div>
            
            {/* Action button inside dropzone if file selected */}
            {selectedFile && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUpload();
                }}
                disabled={uploading}
                className="mt-2 relative z-20 bg-blue-600 text-white rounded-xl px-5 py-2 font-semibold text-xs hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 border-0"
              >
                {uploading ? (
                  <>
                    <i className="bi bi-arrow-repeat animate-spin" /> Subiendo...
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-upload-fill" /> Guardar Archivo
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Documents List */}
      <div>
        <h6 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Registros ({documents.length})</h6>
        
        {documents.length === 0 ? (
          <div className="bg-gray-50 text-gray-500 p-4 rounded-2xl flex items-center gap-3 border border-gray-100">
            <i className="bi bi-folder2-open text-xl opacity-50" />
            <p className="text-sm font-medium m-0">El expediente está vacío.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {documents.map((doc, index) => {
              const fileGroup = doc.type.split('/')[0]; // 'image', 'application', 'video'
              const colorCode = getFileTypeColor(doc.type);
              
              // Map reactstrap colors to tailwind equivalents safely
              const colorMap: Record<string, string> = {
                'danger': 'red', 'primary': 'blue', 'info': 'cyan', 
                'success': 'emerald', 'warning': 'amber', 'secondary': 'gray'
              };
              const twColor = colorMap[colorCode] || 'gray';
              
              return (
                <motion.div 
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Icon Bubble */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-${twColor}-50 text-${twColor}-600`}>
                      <i className={`${getFileIcon(doc.type, doc.name)} text-2xl`} />
                    </div>
                    
                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-gray-900 text-sm truncate pr-2 mb-0.5">
                        {doc.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 truncate">
                        <span className="uppercase text-[10px] tracking-wider bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {doc.type.split('/')[1]?.substring(0, 4) || 'FILE'}
                        </span>
                        <span>•</span>
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>
                          {new Date(doc.uploadedAt).toLocaleDateString('es-ES', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-50 mt-2 sm:mt-0">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors border-0 bg-transparent"
                      title="Descargar"
                    >
                      <i className="bi bi-download text-lg" />
                    </button>
                    
                    {canManage && (
                      <>
                        <button
                          onClick={() => onRename?.(doc)}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors border-0 bg-transparent"
                          title="Renombrar"
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          onClick={() => onDelete?.(doc)}
                          disabled={deletingId === doc.id}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors border-0 bg-transparent disabled:opacity-50"
                          title="Eliminar"
                        >
                          {deletingId === doc.id ? (
                            <i className="bi bi-arrow-repeat animate-spin" />
                          ) : (
                            <i className="bi bi-trash text-lg" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDocumentsSection;
