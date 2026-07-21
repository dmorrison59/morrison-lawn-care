import type { PropsWithChildren } from "react";
import { Platform, StyleSheet } from "react-native";

import { View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";

/** Centered, width-capped card used by the login/sign-up/onboarding screens. */
export function AuthCard({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.page}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
            borderColor: colorScheme === "dark" ? "#2c2c2e" : "#e5e5e5",
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 12,
    padding: 32,
    gap: 12,
    ...Platform.select({
      web: { boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)" },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      },
    }),
  },
});
