import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ListStackParamList } from '../../types/navigation';
import { ListsScreen } from '../../screens/ListsScreen';
import { CreateListScreen } from '../../screens/CreateListScreen';
import { ListDetailsScreen } from '../../screens/ListDetailsScreen';
import { ScannerScreen } from '../../screens/ScannerScreen';
import { theme } from '../../theme';

const Stack = createStackNavigator<ListStackParamList>();

export const ListNavigator: React.FC = () => {
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
        name="Lists"
        component={ListsScreen}
        options={{
          title: 'Einkaufslisten',
        }}
      />
      <Stack.Screen
        name="CreateList"
        component={CreateListScreen}
        options={{
          title: 'Neue Liste',
        }}
      />
      <Stack.Screen
        name="ListDetails"
        component={ListDetailsScreen}
        options={{
          title: 'Listendetails',
        }}
      />
      <Stack.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          title: 'Barcode Scanner',
        }}
      />
    </Stack.Navigator>
  );
};