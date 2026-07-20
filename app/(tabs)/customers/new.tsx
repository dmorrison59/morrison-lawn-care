import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from "react-native";
import { useRouter } from "expo-router";

import { Text, View } from "@/components/Themed";
import { useAuth } from "@/lib/auth-context";
import { createCustomer } from "@/lib/customers";

export default function NewCustomerScreen() {
  const router = useRouter();
  const { session, business } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!business || !session) return;
    setError(null);
    setSubmitting(true);
    try {
      await createCustomer({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        businessId: business.id,
        userId: session.user.id,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create customer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} autoFocus />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, (submitting || !name.trim()) && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={submitting || !name.trim()}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2f6f4e",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#c0392b",
  },
});
