import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useTheme } from '@/design-system';
import type { Ticket } from '@/lib/domain';
import { TICKET_STUB_WIDTH, TicketCard } from '@/features/shared';

/** The full card's own proportions, so the halves can be sized before layout. */
const CARD_ASPECT = 300 / 168;

/**
 * How far the torn panel's far corner travels past the card's edge at full
 * tear — the 9° swing plus the 10px drift. Callers leave this much room.
 */
export const TEAR_SWING = 44;

interface TearStageProps {
  ticket: Ticket;
  /** 0 intact → 1 torn. Owned by the caller: a pan on 티켓 절취, a constant on 응모완료. */
  progress: SharedValue<number>;
  width: number;
  /** 응모완료 shows the stub as USED. */
  spent?: boolean;
}

/**
 * The ticket as two halves that hinge apart along the perforation.
 *
 * Both halves are the same `TicketCard`, each clipped to its side of the stub
 * boundary and rotated about the foot of the perforation — the panel by −9°,
 * the stub by +7°, the angles 1a tears at. The tear front and the grip
 * travel down the perforation with `progress`. 1a's zig-zag teeth need a
 * polygon clip React Native does not have; the dashed rule is the tear line.
 *
 * Purely visual. The server sees one `enterRaffle` at the end of the tear —
 * docs/reference/backend-contract.md is explicit that 절취 is client-side.
 */
export function TearStage({ ticket, progress, width, spent = false }: TearStageProps) {
  const { token } = useTheme();
  const height = width / CARD_ASPECT;
  const left = width - TICKET_STUB_WIDTH;
  const right = TICKET_STUB_WIDTH;

  const panelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateX: left / 2 },
        { translateY: height / 2 },
        { rotate: `${-p * 9}deg` },
        { translateX: -left / 2 },
        { translateY: -height / 2 },
        { translateX: -p * 10 },
      ],
    };
  });

  const stubStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateX: -right / 2 },
        { translateY: height / 2 },
        { rotate: `${p * 7}deg` },
        { translateX: right / 2 },
        { translateY: -height / 2 },
        { translateX: p * 10 },
      ],
    };
  });

  const frontStyle = useAnimatedStyle(() => ({
    height: 10 + progress.value * (height - 20),
    opacity: spent ? 0 : 0.35 + progress.value * 0.65,
  }));

  const gripStyle = useAnimatedStyle(() => ({
    top: 10 + progress.value * (height - 20) - 13,
    opacity: spent ? 0 : 1,
  }));

  const card = (
    <TicketCard
      placeName={ticket.placeName}
      serial={ticket.serial}
      issuedAt={ticket.issuedAt}
      spent={spent}
    />
  );

  return (
    <View style={{ width, height }}>
      <Animated.View style={[styles.half, { width: left, height }, panelStyle]}>
        <View style={{ width }}>{card}</View>
      </Animated.View>
      <Animated.View style={[styles.half, { left, width: right, height }, stubStyle]}>
        <View style={{ width, marginLeft: -left }}>{card}</View>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.front, { left: left - 1, backgroundColor: token.accent.fillColor }, frontStyle]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.grip,
          { left: left - 13, backgroundColor: token.accent.fillColor, borderColor: token.accent.onFillColor },
          gripStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  half: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  front: {
    position: 'absolute',
    top: 0,
    width: 2,
  },
  grip: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
  },
});
