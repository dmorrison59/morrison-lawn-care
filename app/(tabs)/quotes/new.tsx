import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { Text } from "@/components/Themed";
import { useAuth } from "@/lib/auth-context";
import { listCustomers, listProperties, type Customer, type Property } from "@/lib/customers";
import { createQuote } from "@/lib/quotes";

export default function NewQuoteScreen() {
  const router = useRouter();
  const { session, business } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState<string | null>(null);

  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCustomers()
      .then(setCustomers)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load customers"))
      .finally(() => setLoadingCustomers(false));
  }, []);

  useEffect(() => {
    setPropertyId(null);
    if (!customerId) {
      setProperties([]);
      return;
    }
    listProperties(customerId)
      .then(setProperties)
      .catch(() => setProperties([]));
  }, [customerId]);

  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null;

  const onSubmit = async () => {
    if (!business || !session || !customerId) return;
    setError(null);
    setSubmitting(true);
    try {
      const quote = await createQuote({
        customerId,
        propertyId,
        notes: notes.trim() || null,
        validUntil: validUntil.trim() || null,
        businessId: business.id,
        userId: session.user.id,
      });
      router.replace(`/(tabs)/quotes/${quote.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create quote");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <Text style={styles.label}>Customer</Text>
        {loadingCustomers ? (
          <ActivityIndicator />
        ) : customers.length === 0 ? (
          <Text style={styles.empty}>No customers yet — add one first.</Text>
        ) : (
          <View style={styles.pickerList}>
            {customers.map((customer) => (
              <Pressable
                key={customer.id}
                style={[styles.pickerItem, customerId === customer.id && styles.pickerItemSelected]}
                onPress={() => setCustomerId(customer.id)}
              >
                <Text
                  style={[styles.pickerItemText, customerId === customer.id && styles.pickerItemTextSelected]}
                >
                  {customer.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {selectedCustomer && properties.length > 0 && (
          <>
            <Text style={styles.label}>Property (optional)</Text>
            <View style={styles.pickerList}>
              {properties.map((property) => (
                <Pressable
                  key={property.id}
                  style={[styles.pickerItem, propertyId === property.id && styles.pickerItemSelected]}
                  onPress={() => setPropertyId(propertyId === property.id ? null : property.id)}
                >
                  <Text
                    style={[styles.pickerItemText, propertyId === property.id && styles.pickerItemTextSelected]}
                  >
                    {property.address}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>Valid until (YYYY-MM-DD, optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="2026-09-30"
          value={validUntil}
          onChangeText={setValidUntil}
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput style={styles.input} placeholder="Notes" value={notes} onChangeText={setNotes} multiline />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, (submitting || !customerId) && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={submitting || !customerId}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create quote</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  form: {
    width: "100%",
    maxWidth: 480,
    gap: 8,
  },
  label: {
    fontSize: 13,
    opacity: 0.6,
    textTransform: "uppercase",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  pickerList: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
  },
  pickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  pickerItemSelected: {
    backgroundColor: "rgba(47, 111, 78, 0.12)",
  },
  pickerItemText: {
    fontSize: 15,
  },
  pickerItemTextSelected: {
    fontWeight: "600",
    color: "#2f6f4e",
  },
  button: {
    backgroundColor: "#2f6f4e",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
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
  empty: {
    opacity: 0.6,
  },
});
