import { useEffect, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { SdsColors } from '@/design-system';
import { useMotionEnabled } from './useMotionEnabled';

/** Foil stays BELOW the ticket ink, so reflections never wash out its details. */
export function TicketFoil({ animate, spent }: { animate: boolean; spent: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const motion = useMotionEnabled();
  const sweep = useSharedValue(-1);
  useEffect(() => {
    if (motion && animate && !spent) {
      sweep.value = -1;
      sweep.value = withRepeat(withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.quad) }), -1, true);
    } else {
      cancelAnimation(sweep);
      sweep.value = 0;
    }
    return () => cancelAnimation(sweep);
  }, [animate, motion, spent, sweep]);
  const reflection = useAnimatedStyle(() => ({
    transform: [{ translateX: sweep.value * 180 }, { rotate: '-22deg' }],
  }));
  return (
    <View pointerEvents="none" accessible={false} style={[StyleSheet.absoluteFill, spent && styles.spent]}>
      <Svg width="100%" height="100%" viewBox="0 0 300 168" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={`${id}foil`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={SdsColors.ticketPink} />
            <Stop offset="0.28" stopColor={SdsColors.ticketLilac} />
            <Stop offset="0.46" stopColor={SdsColors.ticketMint} />
            <Stop offset="0.62" stopColor={SdsColors.ticketPearl} />
            <Stop offset="0.8" stopColor={SdsColors.pink} />
            <Stop offset="1" stopColor={SdsColors.ticketLilac} />
          </LinearGradient>
        </Defs>
        <Rect width="300" height="168" fill={`url(#${id}foil)`} />
        <Path d="M215 18v12m-6-6h12M276 130v10m-5-5h10M188 133v6m-3-3h6" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      </Svg>
      {!spent && (
        <Animated.View style={[styles.reflection, reflection]}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id={`${id}light`} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="white" stopOpacity="0" />
                <Stop offset="0.5" stopColor="white" stopOpacity="0.65" />
                <Stop offset="1" stopColor="white" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${id}light)`} />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  reflection: { position: 'absolute', left: '20%', top: '-60%', width: '60%', height: '220%' },
  spent: { opacity: 0.32 },
});
