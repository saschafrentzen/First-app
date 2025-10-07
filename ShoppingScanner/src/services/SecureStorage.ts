import { biometricService } from './BiometricService';
import * as SecureStore from 'expo-secure-store';

export interface SecureStorageOptions {
  requireAuth?: boolean;
  authReason?: string;
}

class SecureStorage {
  private static instance: SecureStorage;

  private constructor() {}

  public static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  /**
   * Speichert einen Wert sicher ab
   */
  public async setItem(
    key: string,
    value: string,
    options: SecureStorageOptions = {}
  ): Promise<void> {
    try {
      const { requireAuth = true, authReason } = options;

      if (requireAuth) {
        const authenticated = await biometricService.authenticate(
          authReason || 'Zugriff auf geschützte Daten'
        );
        if (!authenticated) {
          throw new Error('Authentifizierung fehlgeschlagen');
        }
      }

      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED
      });
    } catch (error) {
      console.error('Error storing secure item:', error);
      throw error;
    }
  }

  /**
   * Lädt einen sicher gespeicherten Wert
   */
  public async getItem(
    key: string,
    options: SecureStorageOptions = {}
  ): Promise<string | null> {
    try {
      const { requireAuth = true, authReason } = options;

      if (requireAuth) {
        const authenticated = await biometricService.authenticate(
          authReason || 'Zugriff auf geschützte Daten'
        );
        if (!authenticated) {
          throw new Error('Authentifizierung fehlgeschlagen');
        }
      }

      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error retrieving secure item:', error);
      return null;
    }
  }

  /**
   * Löscht einen sicher gespeicherten Wert
   */
  public async removeItem(
    key: string,
    options: SecureStorageOptions = {}
  ): Promise<void> {
    try {
      const { requireAuth = true, authReason } = options;

      if (requireAuth) {
        const authenticated = await biometricService.authenticate(
          authReason || 'Zugriff auf geschützte Daten'
        );
        if (!authenticated) {
          throw new Error('Authentifizierung fehlgeschlagen');
        }
      }

      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing secure item:', error);
      throw error;
    }
  }

  /**
   * Speichert ein Objekt sicher ab
   */
  public async setObject<T>(
    key: string,
    value: T,
    options: SecureStorageOptions = {}
  ): Promise<void> {
    const jsonValue = JSON.stringify(value);
    await this.setItem(key, jsonValue, options);
  }

  /**
   * Lädt ein sicher gespeichertes Objekt
   */
  public async getObject<T>(
    key: string,
    options: SecureStorageOptions = {}
  ): Promise<T | null> {
    const jsonValue = await this.getItem(key, options);
    if (!jsonValue) return null;
    return JSON.parse(jsonValue) as T;
  }
}

export const secureStorage = SecureStorage.getInstance();