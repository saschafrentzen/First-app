export interface Device {
  id: string;
  type: DeviceType;
  name: string;
  lastSeen: Date;
  connected: boolean;
  lastData?: any;
}

export enum DeviceType {
  SMART_FRIDGE = 'SMART_FRIDGE',
  TEMPERATURE_SENSOR = 'TEMPERATURE_SENSOR',
  HUMIDITY_SENSOR = 'HUMIDITY_SENSOR',
}

export interface DeviceStatus {
  online: boolean;
  type: DeviceType;
  name: string;
}

export interface DeviceCommand {
  command: string;
  payload: any;
}