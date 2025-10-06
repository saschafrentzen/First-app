import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ListManagementScreen from '../screens/ListManagementScreen';
import ScannerScreen from '../screens/ScannerScreen';
import HistoryScreen from '../screens/HistoryScreen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootStackParamList>();

const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Lists"
      component={ListManagementScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Scanner"
      component={ScannerScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const MainNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: '#6200ee',
      tabBarInactiveTintColor: 'gray',
    }}
  >
    <Tab.Screen
      name="Lists"
      component={MainStack}
      options={{
        title: 'Shopping Lists',
        tabBarIcon: ({ color, size }) => (
          <Icon name="format-list-bulleted" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Icon name="history" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

export default MainNavigator;