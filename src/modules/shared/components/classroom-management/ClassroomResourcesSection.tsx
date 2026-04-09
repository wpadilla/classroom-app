import React, { useMemo } from 'react';
import { Spinner } from 'reactstrap';
import { motion } from 'framer-motion';
import { IClassroomResource } from '../../../../models';
import { EmptyState, SearchInput } from '../../../../components/mobile';
import SectionHeader from '../../../../components/student/SectionHeader';
import { formatFileSize, getFileIcon, getFileTypeColor } from '../../../../utils/fileUtils';

interface ClassroomResourcesSectionProps {
  resources: IClassroomResource[];
  isFinalized: boolean;
  selectedFile: File | null;
  uploadingResource: boolean;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
  onDownload: (url: string, filename: string) => void;
  onDelete: (resourceId: string, filename: string) => void;
}

const ClassroomResourcesSection: React.FC<ClassroomResourcesSectionProps> = ({
  resources,
  isFinalized,
  selectedFile,
  uploadingResource,
  searchQuery,
  onSearchQueryChange,
  onFileChange,
  onUpload,
  onDownload,
  onDelete,
}) => {
  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) {
      return resources;
    }

    return resources.filter((resource) =>
      resource.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [resources, searchQuery]);

  return (
    <SectionHeader
      icon="bi-folder"
      title="Recursos"
      badge={resources.length}
      badgeColor="bg-slate-100 text-slate-700"
      defaultOpen={false}
    >
      <div className="rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
        {!isFinalized ? (
          <div className="mb-4 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="flex-1">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Subir nuevo recurso
                </label>
                <input
                  type="file"
                  onChange={(event) => onFileChange(event.target.files?.[0] || null)}
                  disabled={uploadingResource}
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600"
                />
                <p className="mb-0 mt-2 text-xs text-slate-500">
                  Documentos, imágenes, audios o presentaciones para compartir con la clase.
                </p>
              </div>

              <button
                type="button"
                onClick={onUpload}
                disabled={!selectedFile || uploadingResource}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadingResource ? (
                  <>
                    <Spinner size="sm" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-upload" />
                    Subir recurso
                  </>
                )}
              </button>
            </div>

            {selectedFile ? (
              <p className="mb-0 mt-3 text-sm text-slate-600">
                Archivo seleccionado: <span className="font-medium">{selectedFile.name}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        {resources.length > 0 ? (
          <div className="mb-4">
            <SearchInput
              placeholder="Buscar recurso por nombre..."
              onSearch={onSearchQueryChange}
            />
          </div>
        ) : null}

        {filteredResources.length === 0 ? (
          <EmptyState
            icon="bi-folder"
            heading={resources.length === 0 ? 'Sin recursos disponibles' : 'Sin coincidencias'}
            description={
              resources.length === 0
                ? isFinalized
                  ? 'No hay recursos disponibles para esta clase.'
                  : 'Sube materiales para que los estudiantes los descarguen desde móvil.'
                : `No encontramos recursos con "${searchQuery}".`
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredResources.map((resource, index) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.04 }}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm"
                      style={{ color: getFileTypeColor(resource.type) }}
                    >
                      <i className={getFileIcon(resource.type, resource.name)} />
                    </div>

                    <div className="min-w-0">
                      <p className="mb-1 truncate text-sm font-semibold text-slate-900">
                        {resource.name}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>{formatFileSize(resource.size)}</span>
                        <span>·</span>
                        <span>{resource.type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                        <span>·</span>
                        <span>
                          {new Date(resource.uploadedAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onDownload(resource.url, resource.name)}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <i className="bi bi-download" />
                      Descargar
                    </button>
                    {!isFinalized ? (
                      <button
                        type="button"
                        onClick={() => onDelete(resource.id, resource.name)}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        <i className="bi bi-trash" />
                        Eliminar
                      </button>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SectionHeader>
  );
};

export default ClassroomResourcesSection;
