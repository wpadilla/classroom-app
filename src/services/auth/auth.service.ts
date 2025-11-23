// Authentication Service

import { FirebaseService, COLLECTIONS } from '../firebase/firebase.service';
import { 
  IUser, 
  UserRole,
  IAuthCredentials, 
  IAuthResponse, 
  IAuthUser, 
  ISession, 
  IRegistrationData 
} from '../../models';
import { where } from 'firebase/firestore';

export class AuthService {
  private static SESSION_KEY = 'classroom_app_session';
  private static SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  /**
   * Login user with phone/email and password
   */
  static async login(credentials: IAuthCredentials): Promise<IAuthResponse> {
    try {
      // Find user by phone or email
      let users = await FirebaseService.queryDocuments<IUser>(
        COLLECTIONS.USERS,
        'phone',
        '==',
        credentials.identifier
      );

      if (users.length === 0) {
        // Try with email if phone didn't match
        users = await FirebaseService.queryDocuments<IUser>(
          COLLECTIONS.USERS,
          'email',
          '==',
          credentials.identifier
        );
      }

      if (users.length === 0) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      const user = users[0];

      // Check password (plain text comparison as requested)
      if (user.password !== credentials.password) {
        return {
          success: false,
          error: 'Contraseña incorrecta'
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Usuario inactivo. Contacte al administrador.'
        };
      }

      // Create session
      const session = await this.createSession(user);

      // Update last login
      await FirebaseService.updateDocument(COLLECTIONS.USERS, user.id, {
        lastLogin: new Date()
      });

      // Store session in localStorage
      this.storeSession(session);
      
      // Store user data in localStorage as fallback for offline
      localStorage.setItem('classroom_app_user', JSON.stringify(user));

      const authUser: IAuthUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isTeacher: user.isTeacher,
        profilePhoto: user.profilePhoto,
        lastLogin: new Date()
      };

      return {
        success: true,
        user: authUser,
        token: session.token,
        message: 'Inicio de sesión exitoso'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Error al iniciar sesión'
      };
    }
  }

  /**
   * Register a new user
   */
  static async register(data: IRegistrationData): Promise<IAuthResponse> {
    try {
      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        return {
          success: false,
          error: 'Las contraseñas no coinciden'
        };
      }

      // Check if phone already exists
      const existingUsers = await FirebaseService.queryDocuments<IUser>(
        COLLECTIONS.USERS,
        'phone',
        '==',
        data.phone
      );

      if (existingUsers.length > 0) {
        return {
          success: false,
          error: 'El número de teléfono ya está registrado'
        };
      }

      // Check if email already exists (if provided)
      if (data.email) {
        const emailUsers = await FirebaseService.queryDocuments<IUser>(
          COLLECTIONS.USERS,
          'email',
          '==',
          data.email
        );

        if (emailUsers.length > 0) {
          return {
            success: false,
            error: 'El correo electrónico ya está registrado'
          };
        }
      }

      // Create new user
      const newUser: Omit<IUser, 'id'> = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password, // Storing plain text as requested
        profilePhoto: typeof data.profilePhoto === 'string' ? data.profilePhoto : undefined,
        role: data.role || 'student',
        isTeacher: false,
        isActive: true,
        enrolledClassrooms: data.classroomToEnroll ? [data.classroomToEnroll] : [],
        completedClassrooms: [],
        teachingClassrooms: [],
        taughtClassrooms: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const userId = await FirebaseService.createDocument(COLLECTIONS.USERS, newUser);

      // Create session
      const userWithId = { ...newUser, id: userId } as IUser;
      const session = await this.createSession(userWithId);

      // Store session
      this.storeSession(session);

      const authUser: IAuthUser = {
        id: userId,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        isTeacher: newUser.isTeacher,
        profilePhoto: newUser.profilePhoto,
        lastLogin: new Date()
      };

      return {
        success: true,
        user: authUser,
        token: session.token,
        message: 'Registro exitoso'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Error al registrar usuario'
      };
    }
  }

  /**
   * Logout current user
   */
  static async logout(): Promise<void> {
    try {
      const session = this.getStoredSession();
      if (session) {
        // Mark session as inactive in database
        await FirebaseService.updateDocument(COLLECTIONS.SESSIONS, session.id, {
          isActive: false
        });
      }
      // Clear local storage
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem('classroom_app_user');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage even if database update fails
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem('classroom_app_user');
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<IAuthUser | null> {
    try {
      const session = this.getStoredSession();
      if (!session) return null;

      // Check if session is still valid
      if (new Date() > new Date(session.expiresAt)) {
        await this.logout();
        return null;
      }

      // Get user from database
      const user = await FirebaseService.getDocument<IUser>(
        COLLECTIONS.USERS,
        session.userId
      );

      if (!user || !user.isActive) {
        await this.logout();
        return null;
      }

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isTeacher: user.isTeacher,
        profilePhoto: user.profilePhoto,
        lastLogin: user.lastLogin || new Date()
      };
    } catch (error) {
      console.error('Get current user error:', error);
      
      // If Firebase fails (offline and not in cache), try localStorage as fallback
      const session = this.getStoredSession();
      if (!session) return null;
      
      // Check if session is still valid
      if (new Date() > new Date(session.expiresAt)) {
        await this.logout();
        return null;
      }
      
      // Try to get user from localStorage backup
      const cachedUserStr = localStorage.getItem('classroom_app_user');
      if (cachedUserStr) {
        try {
          const cachedUser: IUser = JSON.parse(cachedUserStr);
          
          // Verify it's the same user as in the session
          if (cachedUser.id === session.userId && cachedUser.isActive) {
            console.log('Using cached user from localStorage (offline mode)');
            return {
              id: cachedUser.id,
              firstName: cachedUser.firstName,
              lastName: cachedUser.lastName,
              email: cachedUser.email,
              phone: cachedUser.phone,
              role: cachedUser.role,
              isTeacher: cachedUser.isTeacher,
              profilePhoto: cachedUser.profilePhoto,
              lastLogin: cachedUser.lastLogin || new Date()
            };
          }
        } catch (parseError) {
          console.error('Error parsing cached user:', parseError);
        }
      }
      
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const session = this.getStoredSession();
    if (!session) return false;
    
    // Check if session is expired
    if (new Date() > new Date(session.expiresAt)) {
      this.logout();
      return false;
    }
    
    return true;
  }

  /**
   * Check if user has specific role
   */
  static hasRole(role: UserRole): boolean {
    const session = this.getStoredSession();
    if (!session) return false;
    return session.role === role;
  }

  /**
   * Check if user has permission for resource
   */
  static hasPermission(resource: string, action: string): boolean {
    const session = this.getStoredSession();
    if (!session) return false;

    // Admin has all permissions
    if (session.role === 'admin') return true;

    // Check specific permissions based on role
    const permissions = this.getPermissionsByRole(session.role);
    const resourcePermission = permissions.find(p => p.resource === resource);
    
    if (!resourcePermission) return false;
    return resourcePermission.actions.includes(action as any);
  }

  /**
   * Update user password
   */
  static async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      await FirebaseService.updateDocument(COLLECTIONS.USERS, userId, {
        password: newPassword
      });
      return true;
    } catch (error) {
      console.error('Update password error:', error);
      return false;
    }
  }

  // Private helper methods

  private static async createSession(user: IUser): Promise<ISession> {
    const sessionData: Omit<ISession, 'id'> = {
      userId: user.id,
      token: this.generateToken(),
      role: user.role,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.SESSION_DURATION),
      isActive: true,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform
      }
    };

    const sessionId = await FirebaseService.createDocument(COLLECTIONS.SESSIONS, sessionData);
    return { ...sessionData, id: sessionId };
  }

  private static storeSession(session: ISession): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  private static getStoredSession(): ISession | null {
    const sessionStr = localStorage.getItem(this.SESSION_KEY);
    if (!sessionStr) return null;
    
    try {
      return JSON.parse(sessionStr);
    } catch {
      return null;
    }
  }

  private static generateToken(): string {
    // Simple token generation (not secure, but as requested no encryption)
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private static getPermissionsByRole(role: UserRole) {
    const permissionMap = {
      admin: [
        { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'programs', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'classrooms', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'evaluations', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'whatsapp', actions: ['create', 'read', 'update', 'delete'] }
      ],
      teacher: [
        { resource: 'users', actions: ['read'] },
        { resource: 'programs', actions: ['read'] },
        { resource: 'classrooms', actions: ['read', 'update'] },
        { resource: 'evaluations', actions: ['create', 'read', 'update'] },
        { resource: 'whatsapp', actions: ['create', 'read'] }
      ],
      student: [
        { resource: 'users', actions: ['read'] },
        { resource: 'programs', actions: ['read'] },
        { resource: 'classrooms', actions: ['read'] },
        { resource: 'evaluations', actions: ['read'] },
        { resource: 'whatsapp', actions: [] }
      ]
    };

    return permissionMap[role] || [];
  }
}
