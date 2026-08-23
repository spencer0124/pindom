import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import { Shape } from '@/features/shared';
import { Slider } from './Slider';

/** 1a's four tools, in its order, with its glyphs. */
export const TOOLS = [
  { id: '모자이크', glyph: '▩' },
  { id: '스티커', glyph: '✦' },
  { id: '필터', glyph: '◐' },
  { id: '자르기', glyph: '⌗' },
] as const;

export type ToolId = (typeof TOOLS)[number]['id'];

interface ToolStripProps {
  tool: ToolId;
  strength: number;
  onPickTool: (tool: ToolId) => void;
  onStrength: (value: number) => void;
}

/**
 * The tool row and the strength slider under the 편집 canvas.
 *
 * Only 모자이크 does anything in the prototype — its strength drives the patch's
 * opacity — and that is what is built: the other three are affordances 1a draws
 * and leaves inert. They are kept because the row is the screen's layout, and
 * a two-button row reads as a different design. A selected tool is an acid
 * hairline, not a filled card, per `2b`.
 */
export function ToolStrip({ tool, strength, onPickTool, onStrength }: ToolStripProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  return (
    <View style={styles.block}>
      <View style={styles.row}>
        {TOOLS.map((option) => {
          const picked = option.id === tool;
          return (
            <Pressable
              key={option.id}
              onPress={() => onPickTool(option.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: picked }}
              style={[
                styles.tool,
                {
                  borderColor: picked ? token.accent.fillColor : adaptive.grey200,
                  backgroundColor: picked ? token.accent.dimColor : 'transparent',
                },
              ]}
            >
              <Txt typography="t5" fontWeight="bold" color={picked ? adaptive.grey900 : adaptive.grey600}>
                {option.glyph}
              </Txt>
              <Txt typography="st13" fontWeight="medium" color={picked ? adaptive.grey900 : adaptive.grey600}>
                {option.id}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.strength}>
        <Txt typography="st13" color={adaptive.grey500} style={styles.strengthLabel}>
          {tool} 강도
        </Txt>
        {/* No readout — 1a's row is the label and the track; the slider
            carries the value for assistive tech. */}
        <Slider
          value={strength}
          min={0}
          max={100}
          onChange={onStrength}
          accessibilityLabel={`${tool} 강도`}
        />
      </View>
    </View>
  );
}

interface MosaicPatchProps {
  stage: { width: number; height: number };
  opacity: number;
}

/**
 * The 모자이크 patch — 1a places one at a fixed spot as the tool's preview.
 * Diagonal hatching in ink over the chrome ground, blurred by its alpha alone.
 */
export function MosaicPatch({ stage, opacity }: MosaicPatchProps) {
  const adaptive = useAdaptive();
  const width = Math.round(stage.width * 0.18);
  const height = Math.round(width * 0.7);
  const left = Math.round(stage.width * 0.4);
  const top = Math.round(stage.height * 0.22);

  // Diagonal hatching drawn as lines. react-native-svg's <Pattern> tiles
  // unreliably under a rotate transform, so the stripes are explicit.
  const step = 8;
  const lines: number[] = [];
  for (let offset = -height; offset < width + height; offset += step) lines.push(offset);

  return (
    <View style={{ position: 'absolute', left, top, width, height, opacity }} pointerEvents="none">
      <Svg width={width} height={height}>
        <Rect x={0} y={0} width={width} height={height} fill={adaptive.background} />
        {lines.map((offset) => (
          <Line
            key={offset}
            x1={offset}
            y1={0}
            x2={offset + height}
            y2={height}
            stroke={adaptive.grey900}
            strokeWidth={4}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: Shape.gutter,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  tool: {
    flex: 1,
    height: 62,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  strength: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  strengthLabel: {
    width: 64,
  },
});
