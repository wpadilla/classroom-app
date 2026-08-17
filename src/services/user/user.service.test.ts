const mockBatchUpdate = jest.fn();
const mockBatchDelete = jest.fn();
const mockBatchCommit = jest.fn();
const mockWriteBatch = jest.fn();
const mockArrayRemove = jest.fn();
const mockDoc = jest.fn();
const mockDeleteDocument = jest.fn();

jest.mock('firebase/firestore', () => ({
  arrayRemove: (...args: unknown[]) => mockArrayRemove(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  orderBy: jest.fn(),
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
}));

jest.mock('../../utils/firebase', () => ({
  firebaseStoreDB: { name: 'test-database' },
}));

jest.mock('../firebase/firebase.service', () => ({
  COLLECTIONS: {
    USERS: 'users',
    CLASSROOMS: 'classrooms',
  },
  FirebaseService: {
    deleteDocument: (...args: unknown[]) => mockDeleteDocument(...args),
  },
}));

jest.mock('../gcloud/gcloud.service', () => ({ GCloudService: {} }));
jest.mock('../classroom/classroom-enrollment.service', () => ({ ClassroomEnrollmentService: {} }));

import { UserService } from './user.service';

describe('UserService.deleteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBatchCommit.mockResolvedValue(undefined);
    mockDeleteDocument.mockResolvedValue(undefined);
    mockArrayRemove.mockImplementation((value: string) => ({ operation: 'arrayRemove', value }));
    mockDoc.mockImplementation((_database, collectionName: string, id: string) => ({
      collectionName,
      id,
    }));
    mockWriteBatch.mockReturnValue({
      update: mockBatchUpdate,
      delete: mockBatchDelete,
      commit: mockBatchCommit,
    });
  });

  it('removes classroom memberships and the user in one atomic batch', async () => {
    await UserService.deleteUser('student-1', ['classroom-1', 'classroom-2', 'classroom-1']);

    expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
    expect(mockBatchUpdate).toHaveBeenNthCalledWith(
      1,
      { collectionName: 'classrooms', id: 'classroom-1' },
      expect.objectContaining({
        studentIds: { operation: 'arrayRemove', value: 'student-1' },
        updatedAt: expect.any(Date),
      })
    );
    expect(mockBatchDelete).toHaveBeenCalledWith({ collectionName: 'users', id: 'student-1' });
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
    expect(mockDeleteDocument).not.toHaveBeenCalled();
  });

  it('uses the simple delete path when there are no classroom memberships', async () => {
    await UserService.deleteUser('student-1');

    expect(mockDeleteDocument).toHaveBeenCalledWith('users', 'student-1');
    expect(mockWriteBatch).not.toHaveBeenCalled();
  });
});
