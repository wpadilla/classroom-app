// User Service - CRUD operations for users

import { FirebaseService, COLLECTIONS } from '../firebase/firebase.service';
import { IUser, UserRole, IClassroomHistory } from '../../models';
import { where, orderBy } from 'firebase/firestore';
import { GCloudService } from '../gcloud/gcloud.service';

export class UserService {
  /**
   * Get all users
   */
  static async getAllUsers(): Promise<IUser[]> {
    try {
      return await FirebaseService.getDocuments<IUser>(
        COLLECTIONS.USERS,
        [orderBy('createdAt', 'desc')]
      );
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: UserRole): Promise<IUser[]> {
    try {
      return await FirebaseService.queryDocuments<IUser>(
        COLLECTIONS.USERS,
        'role',
        '==',
        role
      );
    } catch (error) {
      console.error(`Error getting users by role ${role}:`, error);
      return [];
    }
  }

  /**
   * Get all teachers (users with isTeacher = true)
   */
  static async getTeachers(): Promise<IUser[]> {
    try {
      return await FirebaseService.queryDocuments<IUser>(
        COLLECTIONS.USERS,
        'isTeacher',
        '==',
        true
      );
    } catch (error) {
      console.error('Error getting teachers:', error);
      return [];
    }
  }

  /**
   * Get all students
   */
  static async getStudents(): Promise<IUser[]> {
    try {
      const allStudents = await FirebaseService.queryDocuments<IUser>(
        COLLECTIONS.USERS,
        'role',
        '==',
        'student'
      );
      
      // Filter out users who are also teachers
      return allStudents.filter(user => !user.isTeacher);
    } catch (error) {
      console.error('Error getting students:', error);
      return [];
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<IUser | null> {
    try {
      return await FirebaseService.getDocument<IUser>(COLLECTIONS.USERS, userId);
    } catch (error) {
      console.error(`Error getting user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get users by classroom (students enrolled in a classroom)
   */
  static async getUsersByClassroom(classroomId: string): Promise<IUser[]> {
    try {
      return await FirebaseService.queryDocuments<IUser>(
        COLLECTIONS.USERS,
        'enrolledClassrooms',
        'array-contains',
        classroomId
      );
    } catch (error) {
      console.error(`Error getting users for classroom ${classroomId}:`, error);
      return [];
    }
  }

  /**
   * Get teachers by classroom
   */
  static async getTeachersByClassroom(classroomId: string): Promise<IUser[]> {
    try {
      return await FirebaseService.queryDocuments<IUser>(
        COLLECTIONS.USERS,
        'teachingClassrooms',
        'array-contains',
        classroomId
      );
    } catch (error) {
      console.error(`Error getting teachers for classroom ${classroomId}:`, error);
      return [];
    }
  }

  /**
   * Create a new user
   */
  static async createUser(userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      return await FirebaseService.createDocument(COLLECTIONS.USERS, userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  static async updateUser(userId: string, updates: Partial<IUser>): Promise<void> {
    try {
      await FirebaseService.updateDocument(COLLECTIONS.USERS, userId, updates);
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, newRole: UserRole, isTeacher: boolean = false): Promise<void> {
    try {
      await FirebaseService.updateDocument(COLLECTIONS.USERS, userId, {
        role: newRole,
        isTeacher
      });
    } catch (error) {
      console.error(`Error updating user role for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Toggle teacher status
   */
  static async toggleTeacherStatus(userId: string): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');
      
      await FirebaseService.updateDocument(COLLECTIONS.USERS, userId, {
        isTeacher: !user.isTeacher
      });
    } catch (error) {
      console.error(`Error toggling teacher status for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Enroll user in classroom
   */
  static async enrollInClassroom(userId: string, classroomId: string): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');
      
      const enrolledClassrooms = user.enrolledClassrooms || [];
      if (!enrolledClassrooms.includes(classroomId)) {
        enrolledClassrooms.push(classroomId);
        await this.updateUser(userId, { enrolledClassrooms });
      }
    } catch (error) {
      console.error(`Error enrolling user ${userId} in classroom ${classroomId}:`, error);
      throw error;
    }
  }

  /**
   * Remove user from classroom
   */
  static async removeFromClassroom(userId: string, classroomId: string): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');
      
      const enrolledClassrooms = (user.enrolledClassrooms || []).filter(id => id !== classroomId);
      await this.updateUser(userId, { enrolledClassrooms });
    } catch (error) {
      console.error(`Error removing user ${userId} from classroom ${classroomId}:`, error);
      throw error;
    }
  }

  /**
   * Assign teacher to classroom
   */
  static async assignTeacherToClassroom(teacherId: string, classroomId: string): Promise<void> {
    try {
      const teacher = await this.getUserById(teacherId);
      if (!teacher) throw new Error('Teacher not found');
      
      const teachingClassrooms = teacher.teachingClassrooms || [];
      if (!teachingClassrooms.includes(classroomId)) {
        teachingClassrooms.push(classroomId);
        await this.updateUser(teacherId, { 
          teachingClassrooms,
          isTeacher: true // Ensure teacher flag is set
        });
      }
    } catch (error) {
      console.error(`Error assigning teacher ${teacherId} to classroom ${classroomId}:`, error);
      throw error;
    }
  }

  /**
   * Remove teacher from classroom
   */
  static async removeTeacherFromClassroom(teacherId: string, classroomId: string): Promise<void> {
    try {
      const teacher = await this.getUserById(teacherId);
      if (!teacher) throw new Error('Teacher not found');
      
      const teachingClassrooms = (teacher.teachingClassrooms || []).filter(id => id !== classroomId);
      await this.updateUser(teacherId, { teachingClassrooms });
    } catch (error) {
      console.error(`Error removing teacher ${teacherId} from classroom ${classroomId}:`, error);
      throw error;
    }
  }

  /**
   * Mark classroom as completed for user
   */
  static async markClassroomCompleted(
    userId: string,
    classroomId: string,
    classroomName: string,
    programId: string,
    programName: string,
    finalGrade: number,
    status: 'completed' | 'dropped' | 'failed' = 'completed'
  ): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');
      
      // Remove from enrolled classrooms
      const enrolledClassrooms = (user.enrolledClassrooms || []).filter(id => id !== classroomId);
      
      // Add to completed classrooms
      const completedClassrooms = user.completedClassrooms || [];
      const completionRecord: IClassroomHistory = {
        classroomId,
        classroomName,
        programId,
        programName,
        role: 'student', // This is for student completion
        enrollmentDate: new Date(), // Should get actual enrollment date
        completionDate: new Date(),
        finalGrade,
        status
      };
      completedClassrooms.push(completionRecord);
      
      await this.updateUser(userId, {
        enrolledClassrooms,
        completedClassrooms
      });
    } catch (error) {
      console.error(`Error marking classroom ${classroomId} as completed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user profile photo
   */
  static async updateProfilePhoto(userId: string, photoFile: File): Promise<string> {
    try {
      const photoUrl = await GCloudService.uploadProfilePhoto(photoFile, userId);
      await this.updateUser(userId, { profilePhoto: photoUrl });
      return photoUrl;
    } catch (error) {
      console.error(`Error updating profile photo for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      await FirebaseService.deleteDocument(COLLECTIONS.USERS, userId);
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Search users by name or phone
   */
  static async searchUsers(query: string): Promise<IUser[]> {
    try {
      const allUsers = await this.getAllUsers();
      const lowerQuery = query.toLowerCase();
      
      return allUsers.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const phone = user.phone.toLowerCase();
        const email = (user.email || '').toLowerCase();
        
        return fullName.includes(lowerQuery) ||
               phone.includes(lowerQuery) ||
               email.includes(lowerQuery);
      });
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStatistics(): Promise<{
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalAdmins: number;
    activeUsers: number;
  }> {
    try {
      const allUsers = await this.getAllUsers();
      
      return {
        totalUsers: allUsers.length,
        totalStudents: allUsers.filter(u => u.role === 'student' && !u.isTeacher).length,
        totalTeachers: allUsers.filter(u => u.isTeacher).length,
        totalAdmins: allUsers.filter(u => u.role === 'admin').length,
        activeUsers: allUsers.filter(u => u.isActive).length
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      return {
        totalUsers: 0,
        totalStudents: 0,
        totalTeachers: 0,
        totalAdmins: 0,
        activeUsers: 0
      };
    }
  }

  /**
   * Validate phone number uniqueness
   */
  static async isPhoneUnique(phone: string, excludeUserId?: string): Promise<boolean> {
    try {
      const users = await FirebaseService.queryDocuments<IUser>(
        COLLECTIONS.USERS,
        'phone',
        '==',
        phone
      );
      
      if (excludeUserId) {
        return users.filter(u => u.id !== excludeUserId).length === 0;
      }
      
      return users.length === 0;
    } catch (error) {
      console.error('Error checking phone uniqueness:', error);
      return false;
    }
  }

  /**
   * Validate email uniqueness
   */
  static async isEmailUnique(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      const users = await FirebaseService.queryDocuments<IUser>(
        COLLECTIONS.USERS,
        'email',
        '==',
        email
      );
      
      if (excludeUserId) {
        return users.filter(u => u.id !== excludeUserId).length === 0;
      }
      
      return users.length === 0;
    } catch (error) {
      console.error('Error checking email uniqueness:', error);
      return false;
    }
  }
}
