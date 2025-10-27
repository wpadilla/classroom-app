// Program Service - CRUD operations for programs

import { FirebaseService, COLLECTIONS } from '../firebase/firebase.service';
import { IProgram, IProgramCreate, IProgramUpdate } from '../../models';
import { orderBy, where } from 'firebase/firestore';

export class ProgramService {
  /**
   * Get all programs
   */
  static async getAllPrograms(): Promise<IProgram[]> {
    try {
      return await FirebaseService.getDocuments<IProgram>(
        COLLECTIONS.PROGRAMS,
        [orderBy('createdAt', 'desc')]
      );
    } catch (error) {
      console.error('Error getting all programs:', error);
      return [];
    }
  }

  /**
   * Get active programs
   */
  static async getActivePrograms(): Promise<IProgram[]> {
    try {
      return await FirebaseService.queryDocuments<IProgram>(
        COLLECTIONS.PROGRAMS,
        'isActive',
        '==',
        true
      );
    } catch (error) {
      console.error('Error getting active programs:', error);
      return [];
    }
  }

  /**
   * Get program by ID
   */
  static async getProgramById(programId: string): Promise<IProgram | null> {
    try {
      return await FirebaseService.getDocument<IProgram>(COLLECTIONS.PROGRAMS, programId);
    } catch (error) {
      console.error(`Error getting program ${programId}:`, error);
      return null;
    }
  }

  /**
   * Get programs by category
   */
  static async getProgramsByCategory(
    category: 'theology' | 'leadership' | 'discipleship' | 'general' | 'other'
  ): Promise<IProgram[]> {
    try {
      return await FirebaseService.queryDocuments<IProgram>(
        COLLECTIONS.PROGRAMS,
        'category',
        '==',
        category
      );
    } catch (error) {
      console.error(`Error getting programs by category ${category}:`, error);
      return [];
    }
  }

  /**
   * Create a new program
   */
  static async createProgram(programData: IProgramCreate): Promise<string> {
    try {
      // Validate unique code
      const existingPrograms = await FirebaseService.queryDocuments<IProgram>(
        COLLECTIONS.PROGRAMS,
        'code',
        '==',
        programData.code
      );
      
      if (existingPrograms.length > 0) {
        throw new Error('Ya existe un programa con este código');
      }
      
      const newProgram: Omit<IProgram, 'id'> = {
        ...programData,
        classrooms: programData.classrooms || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return await FirebaseService.createDocument(COLLECTIONS.PROGRAMS, newProgram);
    } catch (error) {
      console.error('Error creating program:', error);
      throw error;
    }
  }

  /**
   * Update program
   */
  static async updateProgram(programId: string, updates: IProgramUpdate): Promise<void> {
    try {
      // If updating code, check uniqueness
      if (updates.code) {
        const existingPrograms = await FirebaseService.queryDocuments<IProgram>(
          COLLECTIONS.PROGRAMS,
          'code',
          '==',
          updates.code
        );
        
        if (existingPrograms.length > 0 && existingPrograms[0].id !== programId) {
          throw new Error('Ya existe un programa con este código');
        }
      }
      
      await FirebaseService.updateDocument(COLLECTIONS.PROGRAMS, programId, updates);
    } catch (error) {
      console.error(`Error updating program ${programId}:`, error);
      throw error;
    }
  }

  /**
   * Add classroom to program
   */
  static async addClassroomToProgram(programId: string, classroomId: string): Promise<void> {
    try {
      const program = await this.getProgramById(programId);
      if (!program) throw new Error('Programa no encontrado');
      
      const classrooms = program.classrooms || [];
      if (!classrooms.includes(classroomId)) {
        classrooms.push(classroomId);
        await this.updateProgram(programId, { classrooms });
      }
    } catch (error) {
      console.error(`Error adding classroom ${classroomId} to program ${programId}:`, error);
      throw error;
    }
  }

  /**
   * Remove classroom from program
   */
  static async removeClassroomFromProgram(programId: string, classroomId: string): Promise<void> {
    try {
      const program = await this.getProgramById(programId);
      if (!program) throw new Error('Programa no encontrado');
      
      const classrooms = (program.classrooms || []).filter(id => id !== classroomId);
      await this.updateProgram(programId, { classrooms });
    } catch (error) {
      console.error(`Error removing classroom ${classroomId} from program ${programId}:`, error);
      throw error;
    }
  }

  /**
   * Toggle program active status
   */
  static async toggleProgramStatus(programId: string): Promise<void> {
    try {
      const program = await this.getProgramById(programId);
      if (!program) throw new Error('Programa no encontrado');
      
      await this.updateProgram(programId, { isActive: !program.isActive });
    } catch (error) {
      console.error(`Error toggling program ${programId} status:`, error);
      throw error;
    }
  }

  /**
   * Delete program
   */
  static async deleteProgram(programId: string): Promise<void> {
    try {
      // Check if program has classrooms
      const program = await this.getProgramById(programId);
      if (program && program.classrooms && program.classrooms.length > 0) {
        throw new Error('No se puede eliminar un programa con clases asociadas');
      }
      
      await FirebaseService.deleteDocument(COLLECTIONS.PROGRAMS, programId);
    } catch (error) {
      console.error(`Error deleting program ${programId}:`, error);
      throw error;
    }
  }

  /**
   * Get program statistics
   */
  static async getProgramStatistics(programId: string): Promise<{
    totalClassrooms: number;
    activeClassrooms: number;
    totalStudents: number;
    totalTeachers: number;
    averageGrade: number;
  }> {
    try {
      const program = await this.getProgramById(programId);
      if (!program) {
        return {
          totalClassrooms: 0,
          activeClassrooms: 0,
          totalStudents: 0,
          totalTeachers: 0,
          averageGrade: 0
        };
      }
      
      // Get classrooms for this program
      const classrooms = await FirebaseService.queryDocuments<any>(
        COLLECTIONS.CLASSROOMS,
        'programId',
        '==',
        programId
      );
      
      const activeClassrooms = classrooms.filter(c => c.isActive).length;
      
      // Get unique students and teachers
      const studentIds = new Set<string>();
      const teacherIds = new Set<string>();
      
      classrooms.forEach(classroom => {
        (classroom.studentIds || []).forEach((id: string) => studentIds.add(id));
        if (classroom.teacherId) teacherIds.add(classroom.teacherId);
      });
      
      // Calculate average grade (would need evaluation data)
      // For now, return 0
      const averageGrade = 0;
      
      return {
        totalClassrooms: classrooms.length,
        activeClassrooms,
        totalStudents: studentIds.size,
        totalTeachers: teacherIds.size,
        averageGrade
      };
    } catch (error) {
      console.error(`Error getting statistics for program ${programId}:`, error);
      return {
        totalClassrooms: 0,
        activeClassrooms: 0,
        totalStudents: 0,
        totalTeachers: 0,
        averageGrade: 0
      };
    }
  }

  /**
   * Search programs
   */
  static async searchPrograms(query: string): Promise<IProgram[]> {
    try {
      const allPrograms = await this.getAllPrograms();
      const lowerQuery = query.toLowerCase();
      
      return allPrograms.filter(program => {
        const name = program.name.toLowerCase();
        const description = (program.description || '').toLowerCase();
        const code = program.code.toLowerCase();
        
        return name.includes(lowerQuery) ||
               description.includes(lowerQuery) ||
               code.includes(lowerQuery);
      });
    } catch (error) {
      console.error('Error searching programs:', error);
      return [];
    }
  }

  /**
   * Validate program code uniqueness
   */
  static async isProgramCodeUnique(code: string, excludeProgramId?: string): Promise<boolean> {
    try {
      const programs = await FirebaseService.queryDocuments<IProgram>(
        COLLECTIONS.PROGRAMS,
        'code',
        '==',
        code
      );
      
      if (excludeProgramId) {
        return programs.filter(p => p.id !== excludeProgramId).length === 0;
      }
      
      return programs.length === 0;
    } catch (error) {
      console.error('Error checking program code uniqueness:', error);
      return false;
    }
  }
}
