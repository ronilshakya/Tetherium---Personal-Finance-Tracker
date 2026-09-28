import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { ThemeColors } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";
import { fonts } from "@/theme/typography";

interface Segment {
  value: number;
  color: string;
}

export function DonutChart({
  segments,
  size = 112,
  strokeWidth = 12,
  centerLabel,
  centerValue,
  total: explicitTotal,
}: {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
  total?: number;
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = explicitTotal ?? segments.reduce((sum, s) => sum + s.value, 0);

  let cumulativePercent = 0;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceAlt}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {total > 0 &&
          segments.map((segment, i) => {
            const percent = segment.value / total;
            const dashOffset = circumference * (1 - cumulativePercent);
            const dashArray = `${circumference * percent} ${circumference * (1 - percent)}`;
            cumulativePercent += percent;
            return (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                fill="none"
              />
            );
          })}
      </Svg>
      <View style={styles.centerLabelContainer}>
        <Text style={styles.centerLabel}>{centerLabel}</Text>
        <Text style={styles.centerValue}>{centerValue}</Text>
      </View>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { alignItems: "center", justifyContent: "center" },
    centerLabelContainer: { position: "absolute", alignItems: "center" },
    centerLabel: {
      fontSize: 11,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    centerValue: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.text,
      marginTop: 2,
    },
  });
}
