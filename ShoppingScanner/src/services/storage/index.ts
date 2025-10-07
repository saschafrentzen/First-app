import { StorageService } from './storage';

export { StorageService };

// Singleton-Instanz für die App
export const storageService = new StorageService();