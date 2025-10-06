import { TransitionPresets } from '@react-navigation/stack';
import { Animated } from 'react-native';

type AnimatedNavigationParams = {
  current: { progress: Animated.AnimatedInterpolation<number> };
  layouts: { screen: { width: number; height: number } };
};

export const screenTransitions = {
  defaultTransition: {
    ...TransitionPresets.SlideFromRightIOS, // Standardübergang für iOS-ähnliche Slide-Animation
    cardStyleInterpolator: ({ current, layouts }: AnimatedNavigationParams) => {
      return {
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0]
              })
            }
          ],
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1]
          })
        },
        overlayStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5]
          })
        }
      };
    }
  },
  
  modalTransition: {
    ...TransitionPresets.ModalSlideFromBottomIOS, // Modal-Übergang von unten
    cardStyleInterpolator: ({ current, layouts }: AnimatedNavigationParams) => {
      return {
        cardStyle: {
          transform: [
            {
              translateY: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.height, 0]
              })
            }
          ]
        },
        overlayStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.6]
          })
        }
      };
    }
  },

  fadeTransition: {
    ...TransitionPresets.DefaultTransition,
    cardStyleInterpolator: ({ current }: AnimatedNavigationParams) => {
      return {
        cardStyle: {
          opacity: current.progress
        }
      };
    }
  },

  scaleTransition: {
    ...TransitionPresets.DefaultTransition,
    cardStyleInterpolator: ({ current }: AnimatedNavigationParams) => {
      return {
        cardStyle: {
          transform: [
            {
              scale: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1]
              })
            }
          ],
          opacity: current.progress
        }
      };
    }
  }
};