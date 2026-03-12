// Module Utilities - Centralized logic for IModule management

import { IModule } from '../models';

/**
 * Generates a unique module ID
 */
export const generateModuleId = (): string => {
  return `module-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Creates a default module with given week number
 */
export const createDefaultModule = (weekNumber: number): IModule => {
  return {
    id: generateModuleId(),
    name: `Semana ${weekNumber}`,
    weekNumber,
    date: new Date(),
    topics: [],
    materials: [],
    videoUrl: '',
    isCompleted: false,
    description: ''
  };
};

/**
 * Generates an array of default modules
 * @param count Number of modules to generate (default: 8)
 */
export const generateDefaultModules = (count: number = 8): IModule[] => {
  return Array.from({ length: count }, (_, i) => createDefaultModule(i + 1));
};

/**
 * Validates a module has required fields
 */
export const validateModule = (module: IModule): { valid: boolean; error?: string } => {
  if (!module.id) {
    return { valid: false, error: 'El módulo debe tener un ID' };
  }
  if (!module.name?.trim()) {
    return { valid: false, error: 'El nombre del módulo es requerido' };
  }
  if (typeof module.weekNumber !== 'number' || module.weekNumber < 1) {
    return { valid: false, error: 'El número de semana debe ser mayor a 0' };
  }
  return { valid: true };
};

/**
 * Validates an array of modules
 */
export const validateModules = (modules: IModule[]): { valid: boolean; error?: string } => {
  if (!modules || modules.length === 0) {
    return { valid: false, error: 'Debe haber al menos un módulo' };
  }

  for (let i = 0; i < modules.length; i++) {
    const result = validateModule(modules[i]);
    if (!result.valid) {
      return { valid: false, error: `Módulo ${i + 1}: ${result.error}` };
    }
  }

  // Check for duplicate week numbers
  const weekNumbers = modules.map(m => m.weekNumber);
  const uniqueWeeks = new Set(weekNumbers);
  if (weekNumbers.length !== uniqueWeeks.size) {
    return { valid: false, error: 'Los números de semana no pueden repetirse' };
  }

  return { valid: true };
};

/**
 * Renumbers modules sequentially by weekNumber
 */
export const renumberModules = (modules: IModule[]): IModule[] => {
  const sorted = [...modules].sort((a, b) => a.weekNumber - b.weekNumber);
  return sorted.map((module, index) => ({
    ...module,
    weekNumber: index + 1,
    name: module.name.startsWith('Semana ') ? `Semana ${index + 1}` : module.name
  }));
};

/**
 * Formats a date for input[type="date"]
 */
export const formatDateForInput = (date: Date | string | undefined | any): string => {
  if (!date) return '';
  
  // Handle Firestore Timestamp objects
  if (date && typeof date.toDate === 'function') {
    date = date.toDate();
  }
  
  const d = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(d.getTime())) {
    return '';
  }
  
  return d.toISOString().split('T')[0];
};

/**
 * Parses topics/materials from comma-separated string
 */
export const parseStringArray = (value: string): string[] => {
  return value
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
};

/**
 * Joins array to comma-separated string for display
 */
export const joinStringArray = (arr: string[] | undefined): string => {
  return arr?.join(', ') || '';
};
