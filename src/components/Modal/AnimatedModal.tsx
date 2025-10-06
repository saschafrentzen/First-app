import React, { useEffect } from 'react';
import { Animated, ViewStyle, StyleSheet, Dimensions } from 'react-native';

interface AnimatedModalProps {
  visible: boolean;
  children: React.ReactNode;
  animationType?: 'slide' | 'fade' | 'scale';
  duration?: number;
  style?: ViewStyle;
  onClose?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  visible,
  children,
  animationType = 'slide',
  duration = 300,
  style,
  onClose
}) => {
  const animationValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: visible ? 1 : 0,
      duration,
      useNativeDriver: true
    }).start(() => {
      if (!visible && onClose) {
        onClose();
      }
    });
  }, [visible, duration, onClose]);

  const getAnimatedStyle = (): ViewStyle => {
    switch (animationType) {
      case 'slide':
        return {
          transform: [
            {
              translateY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [SCREEN_HEIGHT, 0]
              })
            }
          ]
        };
      case 'fade':
        return {
          opacity: animationValue
        };
      case 'scale':
        return {
          transform: [
            {
              scale: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1]
              })
            }
          ],
          opacity: animationValue
        };
      default:
        return {};
    }
  };

  const [isHidden, setIsHidden] = React.useState(!visible);

  useEffect(() => {
    if (visible) {
      setIsHidden(false);
    }
  }, [visible]);

  if (isHidden) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        getAnimatedStyle()
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  }
});