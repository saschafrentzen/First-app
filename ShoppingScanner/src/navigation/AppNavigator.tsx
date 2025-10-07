import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { IconButton } from 'react-native-paper';
import { RootStackParamList, MainTabsParamList } from '../types/navigation';

// Screens importieren
import { CreateListScreen } from '../screens/CreateListScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ListsScreen } from '../screens/ListsScreen';
import { ListDetailsScreen } from '../screens/ListDetailsScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SmartFridgeScreen } from '../screens/SmartFridgeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'ListStack':
              iconName = 'format-list-bulleted';
              break;
            case 'HouseholdStack':
              iconName = 'account-group';
              break;
            case 'Settings':
              iconName = 'cog';
              break;
            default:
              iconName = 'help-circle';
          }

          return <IconButton icon={iconName} size={size} iconColor={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="ListStack" 
        component={ListsScreen}
        options={{
          title: 'Listen'
        }}
      />
      <Tab.Screen 
        name="HouseholdStack" 
        component={HomeScreen}
        options={{
          title: 'Haushalte'
        }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="MainTabs" 
          component={TabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CreateList" 
          component={CreateListScreen}
          options={{ 
            title: 'Neue Einkaufsliste',
            presentation: 'modal'
          }}
        />
        <Stack.Screen 
          name="ListDetails" 
          component={ListDetailsScreen}
          options={{ title: 'Liste Details' }}
        />
        <Stack.Screen
          name="SmartFridge"
          component={SmartFridgeScreen}
          options={{ title: 'Smart Kühlschrank' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};