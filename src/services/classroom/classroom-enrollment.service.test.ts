const mockBatchUpdate = jest.fn();
const mockBatchCommit = jest.fn();
const mockWriteBatch = jest.fn();
const mockArrayRemove = jest.fn();
const mockArrayUnion = jest.fn();
const mockDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  arrayRemove: (...args: unknown[]) => mockArrayRemove(...args),
  arrayUnion: (...args: unknown[]) => mockArrayUnion(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
}));

jest.mock('../../utils/firebase', () => ({
  firebaseStoreDB: { name: 'test-database' },
}));

import { ClassroomEnrollmentService } from './classroom-enrollment.service';

describe('ClassroomEnrollmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBatchCommit.mockResolvedValue(undefined);
    mockArrayRemove.mockImplementation((value: string) => ({ operation: 'arrayRemove', value }));
    mockArrayUnion.mockImplementation((value: string) => ({ operation: 'arrayUnion', value }));
    mockDoc.mockImplementation((_database, collectionName: string, id: string) => ({
      collectionName,
      id,
    }));
    mockWriteBatch.mockReturnValue({
      update: mockBatchUpdate,
      commit: mockBatchCommit,
    });
  });

  it('enrolls the student on both documents in one batch', async () => {
    await ClassroomEnrollmentService.enrollStudent('classroom-1', 'student-1');

    expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
    expect(mockBatchUpdate).toHaveBeenNthCalledWith(
      1,
      { collectionName: 'classrooms', id: 'classroom-1' },
      {
        studentIds: { operation: 'arrayUnion', value: 'student-1' },
        updatedAt: expect.any(Date),
      }
    );
    expect(mockBatchUpdate).toHaveBeenNthCalledWith(
      2,
      { collectionName: 'users', id: 'student-1' },
      {
        enrolledClassrooms: { operation: 'arrayUnion', value: 'classroom-1' },
        updatedAt: expect.any(Date),
      }
    );
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it('removes the relationship from both documents in one batch', async () => {
    await ClassroomEnrollmentService.unenrollStudent('classroom-1', 'student-1');

    expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
    expect(mockBatchUpdate).toHaveBeenNthCalledWith(
      1,
      { collectionName: 'classrooms', id: 'classroom-1' },
      expect.objectContaining({
        studentIds: { operation: 'arrayRemove', value: 'student-1' },
      })
    );
    expect(mockBatchUpdate).toHaveBeenNthCalledWith(
      2,
      { collectionName: 'users', id: 'student-1' },
      expect.objectContaining({
        enrolledClassrooms: { operation: 'arrayRemove', value: 'classroom-1' },
      })
    );
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it('does not accept incomplete enrollment identifiers', async () => {
    await expect(
      ClassroomEnrollmentService.enrollStudent('', 'student-1')
    ).rejects.toThrow('La clase y el estudiante son obligatorios');

    expect(mockBatchCommit).not.toHaveBeenCalled();
  });
});
