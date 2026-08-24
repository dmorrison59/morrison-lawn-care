import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";

import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Text } from "@/components/Themed";
import { listJobs, type JobWithCustomer } from "@/lib/jobs";

const STATUS_LABELS: Record<JobWithCustomer["status"], string> = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatDate(date: string | null): string | null {
  if (!date) return null;
  return new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function JobsListScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      listJobs()
        .then((data) => {
          if (!cancelled) setJobs(data);
        })
        .catch((e) => {
          if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load jobs");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <ResponsiveContainer maxWidth={800} style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerRight: () => (
            <Pressable onPress={() => router.push("/(tabs)/jobs/new")} hitSlop={12}>
              <Text style={styles.addButton}>Add</Text>
            </Pressable>
          ),
        }}
      />

      {loading && <ActivityIndicator style={styles.loading} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {!loading && !error && jobs.length === 0 && (
        <Text style={styles.empty}>No jobs yet. Tap Add to schedule one.</Text>
      )}

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const date = formatDate(item.scheduled_date);
          return (
            <Pressable style={styles.row} onPress={() => router.push(`/(tabs)/jobs/${item.id}`)}>
              <Text style={styles.rowTitle}>{item.title || item.customers?.name || "Untitled job"}</Text>
              <Text style={styles.rowSubtitle}>
                {[item.customers?.name, STATUS_LABELS[item.status], date].filter(Boolean).join(" · ")}
              </Text>
            </Pressable>
          );
        }}
      />
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  addButton: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2f6f4e",
  },
  loading: {
    marginTop: 24,
  },
  error: {
    color: "#c0392b",
    padding: 16,
  },
  empty: {
    padding: 24,
    textAlign: "center",
    opacity: 0.6,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  rowSubtitle: {
    marginTop: 2,
    opacity: 0.6,
  },
});
