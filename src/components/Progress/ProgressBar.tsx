import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ViewStyle } from 'react-native';

interface Props {
  progress: number;
  width?: number | `${number}%`;
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  borderRadius?: number;
  animated?: boolean;
  duration?: number;
  style?: ViewStyle;
  onAnimationComplete?: () => void;
}

export const AnimatedProgressBar: React.FC<Props> = ({
  progress,
  width = '100%',
  height = 6,
  backgroundColor = '#E0E0E0',
  fillColor = '#4CAF50',
  borderRadius = height / 2,
  animated = true,
  duration = 600,
  style,
  onAnimationComplete
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const prevProgress = useRef(0);

  useEffect(() => {
    if (animated && progress !== prevProgress.current) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false
      }).start(() => {
        onAnimationComplete?.();
      });
    } else if (!animated) {
      progressAnim.setValue(progress);
    }
    prevProgress.current = progress;
  }, [progress, animated, duration]);

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp'
  });

  // Farbinterpolation basierend auf Fortschritt
  const dynamicColor = progressAnim.interpolate({
    inputRange: [0, 80, 100],
    outputRange: [fillColor, fillColor, progress > 100 ? '#F44336' : fillColor],
    extrapolate: 'clamp'
  });

  // Pulseffekt für kritische Werte
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (progress > 90) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [progress > 90]);

  const containerStyle = React.useMemo(
    () => ({
      width: width as ViewStyle['width'],
      height,
      backgroundColor,
      borderRadius
    }),
    [width, height, backgroundColor, borderRadius]
  );

  return (
    <View
      style={[styles.container, containerStyle, style]}
    >
        <Animated.View
          style={[
            styles.fill,
            {
              width: animatedWidth,
              backgroundColor: dynamicColor,
              transform: [{ scale: pulseAnim }]
            }
          ]}
        />
    </View>
  );
};

interface SegmentedProgressProps {
  current: number;
  total: number;
  segments?: number;
  width?: number | `${number}%`;
  height?: number;
  gap?: number;
  activeColor?: string;
  inactiveColor?: string;
  style?: ViewStyle;
}

export const SegmentedProgressBar: React.FC<SegmentedProgressProps> = ({
  current,
  total,
  segments = 5,
  width = '100%',
  height = 4,
  gap = 4,
  activeColor = '#4CAF50',
  inactiveColor = '#E0E0E0',
  style
}) => {
  const segmentAnims = useRef(
    Array(segments).fill(0).map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const progress = (current / total) * segments;
    const animations = segmentAnims.map((anim, index) => {
      return Animated.timing(anim, {
        toValue: index < progress ? 1 : 0,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false
      });
    });

    Animated.stagger(100, animations).start();
  }, [current, total]);

  return (
    <View style={[styles.segmentedContainer, { width: width as any, gap }, style]}>
      {segmentAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.segment,
            {
              flex: 1,
              height,
              backgroundColor: inactiveColor
            }
          ]}
        >
          <Animated.View
            style={[
              styles.segmentFill,
              {
                backgroundColor: activeColor,
                transform: [
                  {
                    scaleX: anim
                  }
                ]
              }
            ]}
          />
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden'
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 0 // Wird dynamisch über Props gesetzt
  },
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  segment: {
    borderRadius: 2,
    overflow: 'hidden'
  },
  segmentFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    transformOrigin: 'left'
  }
});