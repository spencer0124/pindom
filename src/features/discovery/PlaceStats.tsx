import { StyleSheet, View } from 'react-native';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import { formatDistance, Shape } from '@/features/shared';

interface PlaceStatsProps {
  verifyCount: number;
  photoCount: number;
  /** Null when there is no fix — the cell is dropped rather than showing 0m. */
  distance: number | null;
}

/**
 * 방문 인증 · 촬영된 사진 · 현재 거리.
 *
 * 1a labels the middle cell 공개 사진. It is the one place the prototype is
 * followed against rather than with: `issueTicket` increments `photoCount` on
 * every mint, public or 보관함, so the number counts photos taken here and the
 * word 공개 was never true of it. The counter is the more useful statistic —
 * asking the backend to increment only for public mints would make the label
 * honest by destroying the only record of how much traffic a place sees — so
 * the label moved instead. Decided 2026-08-26.
 *
 * `1a` draws three filled tiles with a 12px radius. Under `2b` they are three
 * cells divided by vertical rules — the direction says section rules run
 * "between blocks, and vertically between grid cells", which is exactly this,
 * and corner treatment is `2b`'s axis.
 *
 * The distance is the only figure in the accent. It is the one number on the
 * screen the user can act on, and painting the other two as well would spend
 * the restraint that makes it read as important.
 */
export function PlaceStats({ verifyCount, photoCount, distance }: PlaceStatsProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  const cells: { label: string; value: string; accent?: boolean }[] = [
    { label: '방문 인증', value: verifyCount.toLocaleString('ko-KR') },
    { label: '촬영된 사진', value: photoCount.toLocaleString('ko-KR') },
    ...(distance != null
      ? [{ label: '현재 거리', value: formatDistance(distance), accent: true }]
      : []),
  ];

  return (
    <View style={styles.row}>
      {cells.map((cell, index) => (
        <View
          key={cell.label}
          style={[
            styles.cell,
            // The first cell sits flush against the page gutter; only the
            // dividers between cells get inner padding.
            index === 0 && styles.firstCell,
            index > 0 && {
              borderLeftWidth: Shape.rowRule,
              borderLeftColor: adaptive.grey200,
            },
          ]}
        >
          <Txt
            typography="t7"
            color={cell.accent === true ? token.accent.fillColor : adaptive.grey600}
          >
            {cell.label}
          </Txt>
          <Txt
            typography="t4"
            fontWeight="bold"
            color={cell.accent === true ? token.accent.fillColor : adaptive.grey900}
          >
            {cell.value}
          </Txt>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: Shape.gutter,
  },
  cell: {
    flex: 1,
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  firstCell: {
    paddingLeft: 0,
  },
});
