import { Platform } from 'react-native';

// Import environment variables from .env file
// Diese Datei ist der zentrale Ort für alle Umgebungsvariablen
export const SAMSUNG_API_KEY = process.env.SAMSUNG_API_KEY || '';
export const LG_API_KEY = process.env.LG_API_KEY || '';

// Weitere Konfigurationsvariablen
export const API_BASE_URL = Platform.select({
  ios: process.env.IOS_API_URL,
  android: process.env.ANDROID_API_URL,
}) || 'https://api.shoppingscanner.com';