/**
 * Normalizes text for search by removing accents, spaces, special characters and converting to lowercase
 * @param text - The text to normalize
 * @returns Normalized text for search comparison
 */
export const normalizeTextForSearch = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^\w]/g, '') // Remove all non-word characters (spaces, punctuation, etc.)
    .trim();
};

/**
 * Ensures that user objects have the fullName property computed from firstName and lastName
 * @param user - User object with firstName and lastName
 * @returns User object with fullName property
 */
export const ensureFullName = <T extends { firstName?: string; lastName?: string; fullName?: string }>(user: T): T => {
  if (!user) return user;
  
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return {
    ...user,
    fullName: fullName || user.fullName
  };
};

/**
 * Searches for a query in an object by stringifying it and normalizing both texts
 * @param obj - The object to search in
 * @param query - The search query
 * @returns True if the query is found in the object
 */
export const searchInObject = (obj: any, query: string): boolean => {
  if (!query) return true;
  
  const normalizedQuery = normalizeTextForSearch(query);
  const objectString = JSON.stringify(obj);
  const normalizedObjectString = normalizeTextForSearch(objectString);
  
  return normalizedObjectString.includes(normalizedQuery);
};

/**
 * Processes classroom objects to ensure all users (teacher and students) have fullName computed
 * @param classroom - Classroom object to process
 * @returns Processed classroom with fullName for all users
 */
export const processClassroomForSearch = (classroom: any): any => {
  if (!classroom || typeof classroom !== 'object') return classroom;
  
  const processedClassroom = { ...classroom };
  
  // Process teacher
  if (processedClassroom.teacher && typeof processedClassroom.teacher === 'object') {
    processedClassroom.teacher = ensureFullName(processedClassroom.teacher);
  }
  
  // Process students
  if (Array.isArray(processedClassroom.students)) {
    processedClassroom.students = processedClassroom.students.map((student: any) => 
      student && typeof student === 'object' ? ensureFullName(student) : student
    );
  }
  
  return processedClassroom;
};

/**
 * Filters an array of objects based on a search query
 * @param items - Array of items to filter
 * @param query - Search query
 * @returns Filtered array
 */
export const filterBySearch = <T>(items: T[], query: string): T[] => {
  if (!query) return items;
  
  return items.filter(item => {
    let processedItem = item;
    
    // Process classroom objects specially to handle nested users
    if (item && typeof item === 'object' && 'students' in item && 'teacher' in item) {
      processedItem = processClassroomForSearch(item) as T;
    }
    // Process individual user objects
    else if (item && typeof item === 'object' && 'firstName' in item && 'lastName' in item) {
      processedItem = ensureFullName(item as any) as T;
    }
    
    return searchInObject(processedItem, query);
  });
};