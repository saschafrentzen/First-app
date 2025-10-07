import * as SecureStore from 'expo-secure-store';
import { Buffer } from 'buffer';
import { getRandomBytes } from 'expo-crypto';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface KeyMetadata {
  id: string;
  createdAt: string;
  lastUsed: string;
  type: 'master' | 'data' | 'backup';
  algorithm: string;
  keySize: number;
}

class KeyManagementService {
  private static instance: KeyManagementService;
  private activeKeyId: string | null = null;
  private keyMetadata: Map<string, KeyMetadata> = new Map();

  private constructor() {}

  public static getInstance(): KeyManagementService {
    if (!KeyManagementService.instance) {
      KeyManagementService.instance = new KeyManagementService();
    }
    return KeyManagementService.instance;
  }

  /**
   * Initialisiert den Key Management Service
   */
  public async initialize(): Promise<void> {
    await this.loadKeyMetadata();
    await this.loadActiveKeyId();
  }

  /**
   * Generiert ein neues Schlüsselpaar
   */
  public async generateKeyPair(type: 'master' | 'data' | 'backup'): Promise<string> {
    const keyId = await this.generateKeyId();
    const randomBytes = await getRandomBytes(32);
    const key = Buffer.from(randomBytes).toString('hex');

    const metadata: KeyMetadata = {
      id: keyId,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      type,
      algorithm: 'AES',
      keySize: 256
    };

    await this.saveKey(keyId, key);
    await this.saveKeyMetadata(keyId, metadata);

    return keyId;
  }

  /**
   * Holt einen Schlüssel anhand seiner ID
   */
  public async getKey(keyId: string): Promise<string | null> {
    try {
      const key = await SecureStore.getItemAsync(`key_${keyId}`);
      if (key) {
        const metadata = this.keyMetadata.get(keyId);
        if (metadata) {
          metadata.lastUsed = new Date().toISOString();
          await this.saveKeyMetadata(keyId, metadata);
        }
      }
      return key;
    } catch (error) {
      console.error('Error retrieving key:', error);
      return null;
    }
  }

  /**
   * Setzt den aktiven Schlüssel
   */
  public async setActiveKey(keyId: string): Promise<void> {
    const key = await this.getKey(keyId);
    if (!key) throw new Error('Key not found');

    this.activeKeyId = keyId;
    await SecureStore.setItemAsync('activeKeyId', keyId);
  }

  /**
   * Löscht einen Schlüssel
   */
  public async deleteKey(keyId: string): Promise<void> {
    await SecureStore.deleteItemAsync(`key_${keyId}`);
    this.keyMetadata.delete(keyId);
    await this.saveAllKeyMetadata();

    if (this.activeKeyId === keyId) {
      this.activeKeyId = null;
      await SecureStore.deleteItemAsync('activeKeyId');
    }
  }

  /**
   * Rotiert Schlüssel nach einem festgelegten Zeitplan
   */
  public async rotateKeys(retentionDays: number = 30): Promise<void> {
    const now = new Date();
    const retentionDate = new Date(now.getTime() - (retentionDays * 24 * 60 * 60 * 1000));

    for (const [keyId, metadata] of this.keyMetadata.entries()) {
      const lastUsed = new Date(metadata.lastUsed);
      if (lastUsed < retentionDate && metadata.type !== 'master') {
        await this.deleteKey(keyId);
      }
    }
  }

  private async generateKeyId(): Promise<string> {
    const randomBytes = await getRandomBytes(16);
    return Buffer.from(randomBytes).toString('hex');
  }

  private async saveKey(keyId: string, key: string): Promise<void> {
    await SecureStore.setItemAsync(`key_${keyId}`, key);
  }

  private async saveKeyMetadata(keyId: string, metadata: KeyMetadata): Promise<void> {
    this.keyMetadata.set(keyId, metadata);
    await this.saveAllKeyMetadata();
  }

  private async loadKeyMetadata(): Promise<void> {
    try {
      const metadata = await SecureStore.getItemAsync('keyMetadata');
      if (metadata) {
        const parsed = JSON.parse(metadata);
        this.keyMetadata = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Error loading key metadata:', error);
    }
  }

  private async saveAllKeyMetadata(): Promise<void> {
    const metadata = Object.fromEntries(this.keyMetadata);
    await SecureStore.setItemAsync('keyMetadata', JSON.stringify(metadata));
  }

  private async loadActiveKeyId(): Promise<void> {
    this.activeKeyId = await SecureStore.getItemAsync('activeKeyId');
  }

  /**
   * Exportiert einen verschlüsselten Backup der Schlüssel
   */
  public async exportKeys(password: string): Promise<string> {
    const keys: { [key: string]: string } = {};
    for (const [keyId, metadata] of this.keyMetadata.entries()) {
      const key = await this.getKey(keyId);
      if (key) {
        keys[keyId] = key;
      }
    }

    const data = {
      keys,
      metadata: Object.fromEntries(this.keyMetadata)
    };

    // Hier würde die eigentliche Verschlüsselung mit dem Benutzerpasswort stattfinden
    return JSON.stringify(data);
  }

  /**
   * Importiert Schlüssel aus einem verschlüsselten Backup
   */
  public async importKeys(backup: string, password: string): Promise<void> {
    try {
      // Hier würde die Entschlüsselung mit dem Benutzerpasswort stattfinden
      const data = JSON.parse(backup);

      for (const [keyId, key] of Object.entries(data.keys)) {
        await this.saveKey(keyId, key as string);
      }

      for (const [keyId, metadata] of Object.entries(data.metadata)) {
        this.keyMetadata.set(keyId, metadata as KeyMetadata);
      }

      await this.saveAllKeyMetadata();
    } catch (error) {
      console.error('Error importing keys:', error);
      throw new Error('Failed to import keys');
    }
  }
}

export const keyManagementService = KeyManagementService.getInstance();