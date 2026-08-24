import { Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Text, View } from "@/components/Themed";
import { useAuth } from "@/lib/auth-context";

export default function SettingsScreen() {
  const router = useRouter();
  const { session, business, role, signOut } = useAuth();

  return (
    <ResponsiveContainer maxWidth={560} style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Business</Text>
        <Text style={styles.value}>{business?.name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Industry</Text>
        <Text style={styles.value}>{business?.industry_type}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Logged in as</Text>
        <Text style={styles.value}>{session?.user.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{role}</Text>
      </View>

      <Pressable
        style={styles.linkRow}
        onPress={() => router.push("/(tabs)/settings/pricing-tiers")}
      >
        <Text style={styles.linkText}>Pricing tiers</Text>
        <Text style={styles.linkChevron}>›</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => signOut()}>
        <Text style={styles.buttonText}>Log out</Text>
      </Pressable>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  section: {
    gap: 2,
  },
  label: {
    fontSize: 13,
    opacity: 0.6,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 16,
  },
  linkRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
  },
  linkText: {
    fontSize: 16,
  },
  linkChevron: {
    fontSize: 20,
    opacity: 0.4,
  },
  button: {
    marginTop: 24,
    backgroundColor: "#c0392b",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
