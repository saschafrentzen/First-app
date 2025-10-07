import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MainTabsParamList } from '../types/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { ListNavigator } from './stacks/ListNavigator';
import { HouseholdNavigator } from './stacks/HouseholdNavigator';
import { SettingsScreen } from '../screens/SettingsScreen';
import { theme } from '../theme';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export const Navigation: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.grey,
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.background,
          },
          headerStyle: {
            backgroundColor: theme.colors.background,
            shadowColor: 'transparent',
            elevation: 0,
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ListStack"
          component={ListNavigator}
          options={{
            headerShown: false,
            title: 'Listen',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="format-list-checks" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="HouseholdStack"
          component={HouseholdNavigator}
          options={{
            headerShown: false,
            title: 'Haushalte',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-group" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Einstellungen',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cog" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};