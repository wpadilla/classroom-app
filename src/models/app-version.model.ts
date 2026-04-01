export interface IAppVersionConfig {
  id: string;
  version: string;
  releaseNotes?: string;
  updatedAt: Date;
  updatedBy?: string;
  updatedByName?: string;
}

export type IAppVersionConfigUpsert = Omit<IAppVersionConfig, 'id' | 'updatedAt'>;
