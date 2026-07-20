import type { PropsWithChildren } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

/**
 * Caps content width and centers it horizontally. Full width up to
 * `maxWidth`, so it still looks right on a narrow phone screen — this isn't
 * a mobile-vs-web branch, just a sane width for any viewport wider than the
 * cap.
 */
export function ResponsiveContainer({
  maxWidth = 720,
  style,
  children,
}: PropsWithChildren<{ maxWidth?: number; style?: ViewStyle }>) {
  return (
    <View style={styles.outer}>
      <View style={[styles.inner, { maxWidth }, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  inner: {
    flex: 1,
    width: "100%",
  },
});
