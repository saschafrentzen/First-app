import { StyleSheet, Animated } from 'react-native';
import React, { useCallback } from 'react';

interface SequentialFadeInProps {
  children: React.ReactNode[];
  delay?: number;
  duration?: number;
  style?: any;
}

export const SequentialFadeIn: React.FC<SequentialFadeInProps> = ({
  children,
  delay = 100,
  duration = 300,
  style
}) => {
  const animations = React.useRef(
    children.map(() => new Animated.Value(0))
  ).current;

  const animate = useCallback(() => {
    const sequence = animations.map((animation, index) =>
      Animated.timing(animation, {
        toValue: 1,
        duration,
        delay: delay * index,
        useNativeDriver: true
      })
    );

    Animated.stagger(delay, sequence).start();
  }, [animations, delay, duration]);

  React.useEffect(() => {
    animate();
  }, [animate]);

  return (
    <>
      {children.map((child, index) => (
        <Animated.View
          key={index}
          style={[
            style,
            {
              opacity: animations[index],
              transform: [
                {
                  translateY: animations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }
              ]
            }
          ]}
        >
          {child}
        </Animated.View>
      ))}
    </>
  );
};

interface SlideInViewProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  distance?: number;
  duration?: number;
  delay?: number;
  style?: any;
}

export const SlideInView: React.FC<SlideInViewProps> = ({
  children,
  direction = 'left',
  distance = 100,
  duration = 300,
  delay = 0,
  style
}) => {
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true
    }).start();
  }, [slideAnim, duration, delay]);

  const getTransform = () => {
    switch (direction) {
      case 'right':
        return {
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-distance, 0]
              })
            }
          ]
        };
      case 'left':
        return {
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0]
              })
            }
          ]
        };
      case 'bottom':
        return {
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-distance, 0]
              })
            }
          ]
        };
      case 'top':
        return {
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0]
              })
            }
          ]
        };
    }
  };

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: slideAnim,
          ...getTransform()
        }
      ]}
    >
      {children}
    </Animated.View>
  );
};

interface ScaleInProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  initialScale?: number;
  style?: any;
}

export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  duration = 300,
  delay = 0,
  initialScale = 0.5,
  style
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true
    }).start();
  }, [scaleAnim, duration, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: scaleAnim,
          transform: [
            {
              scale: scaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [initialScale, 1]
              })
            }
          ]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});