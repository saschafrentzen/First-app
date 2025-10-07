import { Buffer } from 'buffer';
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { AES, enc } from 'crypto-js';

export interface EncryptionConfig {
  enabled: boolean;
  keySize: 128 | 192 | 256;
  algorithm: 'AES';
}

class EncryptionService {
  private static instance: EncryptionService;
  private masterKey: string | null = null;
  private config: EncryptionConfig = {
    enabled: false,
    keySize: 256,
    algorithm: 'AES'
  };

  private constructor() {}

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Initialisiert den Verschlüsselungsservice
   */
  public async initialize(): Promise<void> {
    await this.loadConfig();
    if (this.config.enabled) {
      await this.loadMasterKey();
    }
  }

  /**
   * Verschlüsselt Daten mit dem aktuellen Masterkey
   */
  public async encrypt(data: any): Promise<string> {
    if (!this.config.enabled) return JSON.stringify(data);
    if (!this.masterKey) throw new Error('Encryption not initialized');

    const jsonStr = JSON.stringify(data);
    return AES.encrypt(jsonStr, this.masterKey).toString();
  }

  /**
   * Entschlüsselt Daten mit dem aktuellen Masterkey
   */
  public async decrypt(encryptedData: string): Promise<any> {
    if (!this.config.enabled) return JSON.parse(encryptedData);
    if (!this.masterKey) throw new Error('Encryption not initialized');

    const decrypted = AES.decrypt(encryptedData, this.masterKey);
    return JSON.parse(decrypted.toString(enc.Utf8));
  }

  /**
   * Generiert einen neuen Masterkey
   */
  public async generateNewMasterKey(): Promise<void> {
    const randomBytes = await getRandomBytes(32);
    this.masterKey = Buffer.from(randomBytes).toString('hex');
    await this.saveMasterKey();
  }

  /**
   * Aktiviert die Verschlüsselung
   */
  public async enableEncryption(): Promise<void> {
    this.config.enabled = true;
    await this.generateNewMasterKey();
    await this.saveConfig();
  }

  /**
   * Deaktiviert die Verschlüsselung
   */
  public async disableEncryption(): Promise<void> {
    this.config.enabled = false;
    this.masterKey = null;
    await this.saveConfig();
    await SecureStore.deleteItemAsync('masterKey');
  }

  /**
   * Prüft, ob die Verschlüsselung aktiviert ist
   */
  public isEncryptionEnabled(): boolean {
    return this.config.enabled;
  }

  private async loadConfig(): Promise<void> {
    try {
      const storedConfig = await SecureStore.getItemAsync('encryptionConfig');
      if (storedConfig) {
        this.config = JSON.parse(storedConfig);
      }
    } catch (error) {
      console.error('Error loading encryption config:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        'encryptionConfig',
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.error('Error saving encryption config:', error);
    }
  }

  private async loadMasterKey(): Promise<void> {
    try {
      this.masterKey = await SecureStore.getItemAsync('masterKey');
      if (!this.masterKey) {
        await this.generateNewMasterKey();
      }
    } catch (error) {
      console.error('Error loading master key:', error);
    }
  }

  private async saveMasterKey(): Promise<void> {
    if (!this.masterKey) return;
    try {
      await SecureStore.setItemAsync('masterKey', this.masterKey);
    } catch (error) {
      console.error('Error saving master key:', error);
    }
  }

  /**
   * Re-verschlüsselt alle Daten mit einem neuen Schlüssel
   */
  public async reencryptAllData(
    data: any[],
    progressCallback?: (progress: number) => void
  ): Promise<any[]> {
    const oldKey = this.masterKey;
    await this.generateNewMasterKey();
    
    const reencryptedData = [];
    for (let i = 0; i < data.length; i++) {
      const decrypted = await this.decrypt(data[i]);
      const reencrypted = await this.encrypt(decrypted);
      reencryptedData.push(reencrypted);
      
      if (progressCallback) {
        progressCallback((i + 1) / data.length);
      }
    }
    
    return reencryptedData;
  }
}

export const encryptionService = EncryptionService.getInstance();