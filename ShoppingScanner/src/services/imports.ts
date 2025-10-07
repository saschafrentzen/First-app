import { SmartFridgeConfig, FridgeInventoryItem, FridgeTemperature, FridgeCamera, SmartFridgeEvent, SmartFridgeStats } from '../types/smartHome';
import firestore from '@react-native-firebase/firestore';
import { networkService } from './NetworkService';
import { Platform } from 'react-native';
import { SAMSUNG_API_KEY, LG_API_KEY } from '@env';
import { SamsungFamilyHubAPI, LGThinQAPI } from './manufacturers/FridgeManufacturerAPI';