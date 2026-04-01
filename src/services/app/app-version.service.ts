import { doc, getDoc, onSnapshot, setDoc, Timestamp, Unsubscribe } from 'firebase/firestore';
import { IAppVersionConfig, IAppVersionConfigUpsert } from '../../models';
import { firebaseStoreDB } from '../../utils/firebase';
import { APP_VERSION_CONFIG_DOCUMENT_ID } from '../../constants/appUpdate.constants';
import { COLLECTIONS } from '../firebase/firebase.service';

const toDate = (value?: Date | Timestamp | null): Date => {
  if (value instanceof Date) {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  return new Date();
};

const normalizeConfig = (
  documentId: string,
  data: Partial<IAppVersionConfig> | undefined
): IAppVersionConfig | null => {
  if (!data?.version) {
    return null;
  }

  return {
    id: documentId,
    version: `${data.version}`.trim(),
    releaseNotes: data.releaseNotes?.trim() || '',
    updatedAt: toDate(data.updatedAt),
    updatedBy: data.updatedBy,
    updatedByName: data.updatedByName,
  };
};

export class AppVersionService {
  private static getDocumentRef() {
    return doc(firebaseStoreDB, COLLECTIONS.APP_CONFIG, APP_VERSION_CONFIG_DOCUMENT_ID);
  }

  static async getAppVersionConfig(): Promise<IAppVersionConfig | null> {
    const snapshot = await getDoc(this.getDocumentRef());

    if (!snapshot.exists()) {
      return null;
    }

    return normalizeConfig(snapshot.id, snapshot.data() as Partial<IAppVersionConfig>);
  }

  static subscribeToAppVersionConfig(
    callback: (config: IAppVersionConfig | null) => void
  ): Unsubscribe {
    return onSnapshot(this.getDocumentRef(), (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback(normalizeConfig(snapshot.id, snapshot.data() as Partial<IAppVersionConfig>));
    });
  }

  static async upsertAppVersionConfig(config: IAppVersionConfigUpsert): Promise<void> {
    const payload = {
      version: config.version.trim(),
      releaseNotes: config.releaseNotes?.trim() || '',
      updatedAt: new Date(),
      updatedBy: config.updatedBy || '',
      updatedByName: config.updatedByName || '',
    };

    await setDoc(this.getDocumentRef(), payload, { merge: true });
  }
}
