import React from 'react';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import { screenTransitions } from './transitions';
import { BudgetListScreen } from '../screens/BudgetListScreen';
import { BudgetDetailsScreenContainer } from '../screens/BudgetDetailsScreenContainer';
import { PriceTrackingScreen } from '../screens/PriceTrackingScreen';
import { NavigationContainer } from '@react-navigation/native';
import { TransitionSpec } from '@react-navigation/stack/lib/typescript/src/types';

export type RootStackParamList = {
  BudgetList: undefined;
  BudgetDetails: { categoryId: string };
  PriceTracking: { productId: string; userId: string; currentPrice: number };
};

const Stack = createStackNavigator<RootStackParamList>();

const defaultScreenOptions: StackNavigationOptions = {
  headerStyle: {
    backgroundColor: '#fff',
    elevation: 0,
    shadowOpacity: 0
  },
  headerTitleStyle: {
    fontSize: 18,
    fontWeight: '600'
  },
  headerTintColor: '#333',
  ...screenTransitions.defaultTransition,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 300
      }
    } as TransitionSpec,
    close: {
      animation: 'timing',
      config: {
        duration: 250
      }
    } as TransitionSpec
  }
};

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="BudgetList"
        screenOptions={defaultScreenOptions}
      >
        <Stack.Screen
          name="BudgetList"
          component={BudgetListScreen}
          options={{
            title: 'Meine Budgets',
            ...screenTransitions.fadeTransition
          }}
        />
        
        <Stack.Screen
          name="BudgetDetails"
          component={BudgetDetailsScreenContainer}
          options={{
            title: 'Budget Details',
            ...screenTransitions.scaleTransition
          }}
        />
        
        <Stack.Screen
          name="PriceTracking"
          component={PriceTrackingScreen}
          options={{
            title: 'Preisverlauf',
            ...screenTransitions.modalTransition
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};