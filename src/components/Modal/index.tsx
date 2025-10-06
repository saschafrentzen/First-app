import React from 'react';
import { View, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { AnimatedModal } from './AnimatedModal';
import ModalBackdrop from './ModalBackdrop';

interface ModalProps {
  visible: boolean;
  children: React.ReactNode;
  onClose?: () => void;
  animationType?: 'slide' | 'fade' | 'scale';
  duration?: number;
  backdropOpacity?: number;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  children,
  onClose,
  animationType = 'slide',
  duration = 300,
  backdropOpacity = 0.5,
  style,
  contentStyle
}) => {
  return (
    <View style={[styles.container, !visible && styles.hidden]}>
      <ModalBackdrop
        visible={visible}
        onPress={onClose}
        opacity={backdropOpacity}
        duration={duration}
      />
      <AnimatedModal
        visible={visible}
        animationType={animationType}
        duration={duration}
        style={style}
        onClose={onClose}
      >
        <View style={[styles.content, contentStyle]}>
          {children}
        </View>
      </AnimatedModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  hidden: {
    display: 'none'
  },
  content: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: Dimensions.get('window').height * 0.8,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto'
  }
});