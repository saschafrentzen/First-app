import { StyleSheet, Animated, Easing } from 'react-native';
import React from 'react';

interface AnimatedMountProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: any;
  animation?: 'fadeIn' | 'slideUp' | 'scale' | 'fadeInRight';
}

export const AnimatedMount: React.FC<AnimatedMountProps> = ({
  children,
  duration = 300,
  delay = 0,
  style,
  animation = 'fadeIn'
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease)
    }).start();
  }, []);

  const getAnimationStyle = () => {
    switch (animation) {
      case 'fadeIn':
        return {
          opacity: animatedValue
        };
      case 'slideUp':
        return {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })
            }
          ]
        };
      case 'scale':
        return {
          opacity: animatedValue,
          transform: [
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1]
              })
            }
          ]
        };
      case 'fadeInRight':
        return {
          opacity: animatedValue,
          transform: [
            {
              translateX: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0]
              })
            }
          ]
        };
      default:
        return {
          opacity: animatedValue
        };
    }
  };

  return (
    <Animated.View style={[style, getAnimationStyle()]}>
      {children}
    </Animated.View>
  );
};

export const useAnimatedValue = (initialValue: number = 0) => {
  return React.useRef(new Animated.Value(initialValue)).current;
};

export const useAnimatedSequence = (values: Animated.Value[], duration: number = 300) => {
  const animate = React.useCallback(() => {
    const animations = values.map((value) =>
      Animated.timing(value, {
        toValue: 1,
        duration,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      })
    );

    Animated.stagger(100, animations).start();
  }, [values, duration]);

  const reset = React.useCallback(() => {
    values.forEach(value => value.setValue(0));
  }, [values]);

  return { animate, reset };
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});