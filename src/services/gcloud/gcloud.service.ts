// Google Cloud Storage Service for Profile Photo Upload

import axios from 'axios';

// Use VITE_APP_API environment variable
const API_URL = process.env.VITE_APP_API || 'https://grupo-betuel-api.click/api';
const GCLOUD_PUBLIC_URL = 'https://storage.googleapis.com/betuel-tech-photos/';

export interface IUploadResponse {
  url: string;
  fields: Record<string, string>;
}

export interface IMediaFile {
  file: File;
  title?: string;
  type?: string;
}

export interface IMedia {
  name?: string;
  title?: string;
  content: string;
  type?: string;
  tag?: string;
}

export class GCloudService {
  /**
   * Compress image before upload
   */
  private static async compressImage(file: File): Promise<File> {
    // For now, return the file as-is
    // In production, you would use a library like browser-image-compression
    return file;
  }

  /**
   * Get upload URL from backend
   */
  private static async getUploadUrl(
    filename: string,
    tag: string = 'profile',
    type: string = 'image/png'
  ): Promise<IUploadResponse> {
    try {
      const encodedFilename = encodeURIComponent(filename);
      const encodedType = type.replace('/', '^');
      
      const response = await axios.get(
        `${API_URL}/gcloud/upload-url/${encodedFilename}/${tag}/${encodedType}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting upload URL:', error);
      throw error;
    }
  }

  /**
   * Upload file to Google Cloud Storage
   */
  static async uploadFile(
    file: File,
    tag: string = 'profile'
  ): Promise<string> {
    try {
      // Compress image if needed
      const compressedFile = await this.compressImage(file);
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const extension = file.name.split('.').pop() || 'png';
      const filename = `${tag}-${timestamp}-${randomId}.${extension}`;
      
      // Get upload URL from backend
      const { url, fields } = await this.getUploadUrl(filename, tag, file.type);
      
      // Create form data for upload
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', compressedFile);
      
      // Upload to Google Cloud Storage
      await axios.post(url, formData);
      
      // Return public URL
      return `${GCLOUD_PUBLIC_URL}${filename}`;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Upload profile photo
   */
  static async uploadProfilePhoto(file: File, userId: string): Promise<string> {
    try {
      const tag = `profile-${userId}`;
      return await this.uploadFile(file, tag);
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  }

  /**
   * Upload media from base64 or blob
   */
  static async uploadMedia(media: IMediaFile): Promise<IMedia> {
    if (!media.file) {
      throw new Error('No file provided');
    }

    try {
      const type = media.file.type.split('/')[1];
      const mediaNameClean = `${media.title?.split('.')?.[0] || 'media'}`
        .replace(/ /g, '-')
        .toLowerCase();
      const mediaName = `${mediaNameClean}-${Date.now()}-${this.generateId()}.${type}`;
      
      // Create new file with proper name
      const file = new File([media.file], mediaName, { type: media.file.type });
      
      // Upload file
      const url = await this.uploadFile(file, 'media');
      
      return {
        title: mediaName,
        content: url,
        type: media.type || media.file.type,
        name: mediaName
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  /**
   * Delete photo from Google Cloud Storage
   */
  static async deletePhoto(filename: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/gcloud/image/${filename}`);
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  /**
   * Get all images from Google Cloud Storage
   */
  static async getImages(): Promise<string[]> {
    try {
      const response = await axios.get(`${API_URL}/gcloud/images`);
      return response.data;
    } catch (error) {
      console.error('Error getting images:', error);
      return [];
    }
  }

  /**
   * Convert file to base64
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Convert base64 to blob
   */
  static base64ToBlob(base64: string, type: string = 'image/png'): Blob {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  }

  /**
   * Generate random ID
   */
  private static generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}

export default GCloudService;
