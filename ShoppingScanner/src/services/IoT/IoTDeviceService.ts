import { MqttClient, connect } from 'mqtt';
import { Device, DeviceType, DeviceStatus } from './types';
import { StorageService } from '@app/services/storage';

class IoTDeviceService {
    private mqttClient: MqttClient | null = null;
    private devices: Map<string, Device> = new Map();
    private readonly storageKey = 'iot_devices';
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 5;
    private readonly reconnectInterval = 5000; // 5 Sekunden

    constructor(private storageService: StorageService) {
        this.loadSavedDevices();
    }

    private async loadSavedDevices() {
        try {
            const savedDevices = await this.storageService.getData(this.storageKey);
            if (savedDevices) {
                savedDevices.forEach((device: Device) => {
                    this.devices.set(device.id, device);
                });
            }
        } catch (error) {
            console.error('Fehler beim Laden der gespeicherten Geräte:', error);
        }
    }

    async connect(brokerUrl: string) {
        try {
            this.mqttClient = connect(brokerUrl, {
                keepalive: 30,
                connectTimeout: 10000,
                reconnectPeriod: this.reconnectInterval,
                clean: true,
            });

            this.mqttClient.on('connect', () => {
                console.log('Verbunden mit MQTT Broker');
                this.reconnectAttempts = 0;
                this.subscribeToDevices();
            });

            this.mqttClient.on('error', (error) => {
                console.error('MQTT Verbindungsfehler:', error);
                this.handleConnectionError();
            });

            this.mqttClient.on('message', (topic, message) => {
                this.handleDeviceMessage(topic, message);
            });
        } catch (error) {
            console.error('Fehler beim Verbinden mit MQTT Broker:', error);
            throw error;
        }
    }

    private handleConnectionError() {
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Maximale Anzahl an Wiederverbindungsversuchen erreicht');
            this.disconnect();
        }
    }

    private subscribeToDevices() {
        if (!this.mqttClient) return;

        // Globales Topic für Geräteerkennung
        this.mqttClient.subscribe('home/devices/+/status');

        // Individuelle Topics für bekannte Geräte
        this.devices.forEach(device => {
            this.mqttClient?.subscribe(`home/devices/${device.id}/+`);
        });
    }

    private async handleDeviceMessage(topic: string, message: Buffer) {
        try {
            const topicParts = topic.split('/');
            const deviceId = topicParts[2];
            const messageType = topicParts[3];

            switch (messageType) {
                case 'status':
                    await this.handleDeviceStatus(deviceId, message);
                    break;
                case 'data':
                    await this.handleDeviceData(deviceId, message);
                    break;
                default:
                    console.warn('Unbekannter Nachrichtentyp:', messageType);
            }
        } catch (error) {
            console.error('Fehler bei der Verarbeitung der MQTT Nachricht:', error);
        }
    }

    private async handleDeviceStatus(deviceId: string, message: Buffer) {
        try {
            const status = JSON.parse(message.toString());
            const existingDevice = this.devices.get(deviceId);

            if (status.online && !existingDevice) {
                // Neues Gerät gefunden
                const newDevice: Device = {
                    id: deviceId,
                    type: status.type,
                    name: status.name,
                    lastSeen: new Date(),
                    connected: true,
                };
                this.devices.set(deviceId, newDevice);
                await this.saveDevices();
            } else if (existingDevice) {
                // Gerätestatus aktualisieren
                existingDevice.connected = status.online;
                existingDevice.lastSeen = new Date();
                await this.saveDevices();
            }
        } catch (error) {
            console.error('Fehler bei der Verarbeitung des Gerätestatus:', error);
        }
    }

    private async handleDeviceData(deviceId: string, message: Buffer) {
        try {
            const data = JSON.parse(message.toString());
            const device = this.devices.get(deviceId);

            if (device) {
                device.lastData = data;
                device.lastSeen = new Date();
                await this.saveDevices();
            }
        } catch (error) {
            console.error('Fehler bei der Verarbeitung der Gerätedaten:', error);
        }
    }

    private async saveDevices() {
        try {
            await this.storageService.setData(
                this.storageKey,
                Array.from(this.devices.values())
            );
        } catch (error) {
            console.error('Fehler beim Speichern der Geräte:', error);
        }
    }

    getConnectedDevices(): Device[] {
        return Array.from(this.devices.values()).filter(device => device.connected);
    }

    getDeviceById(deviceId: string): Device | undefined {
        return this.devices.get(deviceId);
    }

    async disconnect() {
        if (this.mqttClient) {
            this.mqttClient.end();
            this.mqttClient = null;
        }
    }

    // Methode zum Senden von Befehlen an ein Gerät
    async sendCommand(deviceId: string, command: string, payload: any) {
        if (!this.mqttClient || !this.devices.has(deviceId)) {
            throw new Error('Gerät nicht verfügbar');
        }

        try {
            await this.mqttClient.publish(
                `home/devices/${deviceId}/command`,
                JSON.stringify({ command, payload })
            );
        } catch (error) {
            console.error('Fehler beim Senden des Befehls:', error);
            throw error;
        }
    }
}

export const iotDeviceService = new IoTDeviceService(new StorageService());