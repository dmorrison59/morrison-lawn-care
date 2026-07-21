import { Pressable, StyleSheet } from "react-native";

import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Text, View } from "@/components/Themed";
import { useAuth } from "@/lib/auth-context";

export default function SettingsScreen() {
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
