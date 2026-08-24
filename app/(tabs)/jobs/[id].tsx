import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";

import { Text, View } from "@/components/Themed";
import { getJob, setJobCompleted, updateJob, type JobStatus, type JobWithCustomer } from "@/lib/jobs";

const STATUSES: { value: JobStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function formatCurrency(amount: number): string {
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [job, setJob] = useState<JobWithCustomer | null>(null);
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getJob(id);
      setJob(data);
      setTitle(data.title);
      setScheduledDate(data.scheduled_date ?? "");
      setEstimatedPrice(data.estimated_price?.toString() ?? "");
      setFinalPrice(data.final_price?.toString() ?? "");
      setNotes(data.notes ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load job");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onChangeStatus = async (status: JobStatus) => {
    if (!job || status === job.status) return;

    if (status === "completed" || job.status === "completed") {
      // Completing/reopening also sets completed_at, so route through the
      // dedicated helper instead of a plain field update.
      const price = finalPrice.trim() ? Number(finalPrice) : null;
      if (price !== null && !Number.isFinite(price)) {
        setError("Final price must be a number");
        return;
      }
      setSavingStatus(true);
      setError(null);
      try {
        await setJobCompleted(id, status === "completed", price);
        setJob((prev) =>
          prev ? { ...prev, status, completed_at: status === "completed" ? new Date().toISOString() : null } : prev,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update status");
      } finally {
        setSavingStatus(false);
      }
      return;
    }

    setSavingStatus(true);
    setError(null);
    try {
      await updateJob(id, { status });
      setJob((prev) => (prev ? { ...prev, status } : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  };

  const onSaveDetails = async () => {
    const estimated = estimatedPrice.trim() ? Number(estimatedPrice) : null;
    if (estimated !== null && !Number.isFinite(estimated)) {
      setError("Estimated price must be a number");
      return;
    }

    setSavingDetails(true);
    setError(null);
    try {
      await updateJob(id, {
        title: title.trim(),
        scheduled_date: scheduledDate.trim() || null,
        estimated_price: estimated,
        notes: notes.trim() || null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save job");
    } finally {
      setSavingDetails(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? "Job not found"}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: job.title || "Job" }} />

      <View style={styles.form}>
        <Text style={styles.customerName}>{job.customers?.name ?? "Unknown customer"}</Text>
        {job.properties?.address && <Text style={styles.propertyAddress}>{job.properties.address}</Text>}

        <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
          {STATUSES.map((s) => (
            <Pressable
              key={s.value}
              style={[styles.statusChip, job.status === s.value && styles.statusChipActive]}
              onPress={() => onChangeStatus(s.value)}
              disabled={savingStatus}
            >
              <Text style={[styles.statusChipText, job.status === s.value && styles.statusChipTextActive]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Scheduled date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={scheduledDate}
          onChangeText={setScheduledDate}
          placeholder="2026-09-15"
        />

        <Text style={styles.label}>Estimated price</Text>
        <TextInput
          style={styles.input}
          value={estimatedPrice}
          onChangeText={setEstimatedPrice}
          keyboardType="numeric"
        />

        {(job.status === "completed" || finalPrice) && (
          <>
            <Text style={styles.label}>Final price</Text>
            <TextInput style={styles.input} value={finalPrice} onChangeText={setFinalPrice} keyboardType="numeric" />
          </>
        )}

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

        {job.final_price != null && (
          <Text style={styles.total}>Final: {formatCurrency(job.final_price)}</Text>
        )}
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
  propertyAddress: {
    opacity: 0.6,
    marginTop: -4,
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
  total: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "right",
  },
});
