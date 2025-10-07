export interface SmartFridgeConfig {
  id: string;
  name: string;
  manufacturer: 'Samsung' | 'LG';
  model: string;
  ipAddress: string;
  features: string[];
  lastSync: string;
  isConnected: boolean;
}