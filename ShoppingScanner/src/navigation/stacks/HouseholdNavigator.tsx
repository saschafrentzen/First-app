import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HouseholdStackParamList } from '../../types/navigation';
import {
  HouseholdScreen,
  HouseholdDetailScreen,
  HouseholdSettingsScreen,
  ListSelectionScreen,
  SharedListScreen,
  InviteMemberScreen
} from '../../screens';
import { theme } from '../../theme';

const Stack = createStackNavigator<HouseholdStackParamList>();

export const HouseholdNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
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
      <Stack.Screen
        name="Households"
        component={HouseholdScreen}
        options={{
          title: 'Haushalte',
        }}
      />
      <Stack.Screen
        name="HouseholdDetail"
        component={HouseholdDetailScreen}
        options={{
          title: 'Haushalt',
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="HouseholdSettings"
        component={HouseholdSettingsScreen}
        options={{
          title: 'Einstellungen',
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="ListSelection"
        component={ListSelectionScreen}
        options={{
          title: 'Liste hinzufügen',
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="SharedList"
        component={SharedListScreen}
        options={{
          title: 'Geteilte Liste',
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="InviteMember"
        component={InviteMemberScreen}
        options={{
          title: 'Mitglied einladen',
          headerBackTitle: '',
        }}
      />
    </Stack.Navigator>
  );
};