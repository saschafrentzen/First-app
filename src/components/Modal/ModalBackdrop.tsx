import React, { useEffect } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';

interface ModalBackdropProps {
  visible: boolean;
  onPress?: () => void;
  opacity?: number;
  duration?: number;
}

const ModalBackdrop: React.FC<ModalBackdropProps> = ({
  visible,
  onPress,
  opacity = 0.5,
  duration = 300
}) => {
  const animationValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: visible ? opacity : 0,
      duration,
      useNativeDriver: true
    }).start();
  }, [visible, opacity, duration]);

  if (!visible) {
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: animationValue
          }
        ]}
      />
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    height: Dimensions.get('window').height * 2
  }
});

export default ModalBackdrop;