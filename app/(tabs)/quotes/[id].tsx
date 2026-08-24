import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { Text, View } from "@/components/Themed";
import { useAuth } from "@/lib/auth-context";
import { createJob, getJobForQuote, type Job } from "@/lib/jobs";
import {
  addQuoteItem,
  deleteQuoteItem,
  getQuote,
  listQuoteItems,
  updateQuote,
  type QuoteItem,
  type QuoteStatus,
  type QuoteWithCustomer,
} from "@/lib/quotes";

const STATUSES: { value: QuoteStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
];

function formatCurrency(amount: number): string {
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session, business } = useAuth();

  const [quote, setQuote] = useState<QuoteWithCustomer | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);

  const [newDescription, setNewDescription] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newUnitPrice, setNewUnitPrice] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  const [existingJob, setExistingJob] = useState<Job | null>(null);
  const [convertingToJob, setConvertingToJob] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [quoteData, itemsData, jobData] = await Promise.all([
        getQuote(id),
        listQuoteItems(id),
        getJobForQuote(id),
      ]);
      setQuote(quoteData);
      setItems(itemsData);
      setNotes(quoteData.notes ?? "");
      setValidUntil(quoteData.valid_until ?? "");
      setExistingJob(jobData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load quote");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onChangeStatus = async (status: QuoteStatus) => {
    if (!quote || status === quote.status) return;
    setSavingStatus(true);
    setError(null);
    try {
      await updateQuote(id, { status });
      setQuote((prev) => (prev ? { ...prev, status } : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  };

  const onSaveDetails = async () => {
    setSavingDetails(true);
    setError(null);
    try {
      await updateQuote(id, { notes: notes.trim() || null, valid_until: validUntil.trim() || null });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save quote");
    } finally {
      setSavingDetails(false);
    }
  };

  const onConvertToJob = async () => {
    if (!quote || !business || !session) return;
    setError(null);
    setConvertingToJob(true);
    try {
      const job = await createJob({
        customerId: quote.customer_id,
        propertyId: quote.property_id,
        quoteId: quote.id,
        title: `Job for ${quote.customers?.name ?? "customer"}`,
        scheduledDate: null,
        estimatedPrice: quote.total_amount,
        notes: quote.notes,
        businessId: business.id,
        userId: session.user.id,
      });
      router.push(`/(tabs)/jobs/${job.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create job");
    } finally {
      setConvertingToJob(false);
    }
  };

  const onAddItem = async () => {
    if (!business) return;
    const quantity = Number(newQuantity);
    const unitPrice = Number(newUnitPrice);
    if (!newDescription.trim() || !Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
      setError("Enter a description, quantity, and unit price");
      return;
    }
    setError(null);
    setAddingItem(true);
    try {
      const item = await addQuoteItem({
        quoteId: id,
        description: newDescription.trim(),
        quantity,
        unitPrice,
        businessId: business.id,
      });
      setItems((prev) => [...prev, item]);
      setQuote((prev) => (prev ? { ...prev, total_amount: prev.total_amount + item.line_total } : prev));
      setNewDescription("");
      setNewQuantity("1");
      setNewUnitPrice("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add item");
    } finally {
      setAddingItem(false);
    }
  };

  const onDeleteItem = async (item: QuoteItem) => {
    setError(null);
    try {
      await deleteQuoteItem(item.id, id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setQuote((prev) => (prev ? { ...prev, total_amount: prev.total_amount - item.line_total } : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove item");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!quote) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? "Quote not found"}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: quote.customers?.name ?? "Quote" }} />

      <View style={styles.form}>
        <Text style={styles.customerName}>{quote.customers?.name ?? "Unknown customer"}</Text>

        <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
          {STATUSES.map((s) => (
            <Pressable
              key={s.value}
              style={[styles.statusChip, quote.status === s.value && styles.statusChipActive]}
              onPress={() => onChangeStatus(s.value)}
              disabled={savingStatus}
            >
              <Text style={[styles.statusChipText, quote.status === s.value && styles.statusChipTextActive]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {quote.status === "approved" &&
          (existingJob ? (
            <Pressable
              style={[styles.button, styles.smallButton, styles.jobButton]}
              onPress={() => router.push(`/(tabs)/jobs/${existingJob.id}`)}
            >
              <Text style={styles.buttonText}>View job</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.button, styles.smallButton, styles.jobButton, convertingToJob && styles.buttonDisabled]}
              onPress={onConvertToJob}
              disabled={convertingToJob}
            >
              {convertingToJob ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Convert to job</Text>
              )}
            </Pressable>
          ))}

        <Text style={styles.label}>Valid until (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} value={validUntil} onChangeText={setValidUntil} placeholder="2026-09-30" />

        <Text style={styles.label}>Notes</Text>
        <TextInput style={styles.input} value={notes} onChangeText={setNotes} multiline />

        <Pressable
          style={[styles.button, styles.smallButton, savingDetails && styles.buttonDisabled]}
          onPress={onSaveDetails}
          disabled={savingDetails}
        >
          {savingDetails ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save</Text>}
        </Pressable>

        {error && <Text style={styles.error}>{error}</Text>}

        <Text style={[styles.label, styles.itemsTitle]}>Line items</Text>

        {items.length === 0 && <Text style={styles.empty}>No line items yet.</Text>}

        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <Text style={styles.itemSubtitle}>
                {item.quantity} × {formatCurrency(item.unit_price)} = {formatCurrency(item.line_total)}
              </Text>
            </View>
            <Pressable onPress={() => onDeleteItem(item)} hitSlop={8}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.newItemCard}>
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={newDescription}
            onChangeText={setNewDescription}
          />
          <View style={styles.newItemRow}>
            <TextInput
              style={[styles.input, styles.newItemField]}
              placeholder="Qty"
              keyboardType="numeric"
              value={newQuantity}
              onChangeText={setNewQuantity}
            />
            <TextInput
              style={[styles.input, styles.newItemField]}
              placeholder="Unit price"
              keyboardType="numeric"
              value={newUnitPrice}
              onChangeText={setNewUnitPrice}
            />
          </View>
          <Pressable
            style={[styles.button, styles.smallButton, addingItem && styles.buttonDisabled]}
            onPress={onAddItem}
            disabled={addingItem}
          >
            {addingItem ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add item</Text>}
          </Pressable>
        </View>

        <Text style={styles.total}>Total: {formatCurrency(quote.total_amount)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    alignItems: "center",
  },
  form: {
    width: "100%",
    maxWidth: 640,
    gap: 8,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  customerName: {
    fontSize: 20,
    fontWeight: "bold",
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
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  statusChipActive: {
    backgroundColor: "#2f6f4e",
    borderColor: "#2f6f4e",
  },
  statusChipText: {
    fontSize: 14,
  },
  statusChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#2f6f4e",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  smallButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  jobButton: {
    marginTop: 4,
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
  itemsTitle: {
    marginTop: 16,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  itemInfo: {
    flex: 1,
  },
  itemDescription: {
    fontSize: 15,
    fontWeight: "600",
  },
  itemSubtitle: {
    marginTop: 2,
    opacity: 0.6,
  },
  removeText: {
    color: "#c0392b",
    fontSize: 14,
  },
  newItemCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginTop: 12,
  },
  newItemRow: {
    flexDirection: "row",
    gap: 8,
  },
  newItemField: {
    flex: 1,
  },
  total: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "right",
  },
});
