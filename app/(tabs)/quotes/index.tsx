import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";

import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Text } from "@/components/Themed";
import { listQuotes, type QuoteWithCustomer } from "@/lib/quotes";

const STATUS_LABELS: Record<QuoteWithCustomer["status"], string> = {
  draft: "Draft",
  sent: "Sent",
  approved: "Approved",
  declined: "Declined",
};

function formatCurrency(amount: number): string {
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function QuotesListScreen() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      listQuotes()
        .then((data) => {
          if (!cancelled) setQuotes(data);
        })
        .catch((e) => {
          if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load quotes");
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
            <Pressable onPress={() => router.push("/(tabs)/quotes/new")} hitSlop={12}>
              <Text style={styles.addButton}>Add</Text>
            </Pressable>
          ),
        }}
      />

      {loading && <ActivityIndicator style={styles.loading} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {!loading && !error && quotes.length === 0 && (
        <Text style={styles.empty}>No quotes yet. Tap Add to create one.</Text>
      )}

      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/(tabs)/quotes/${item.id}`)}>
            <Text style={styles.rowTitle}>{item.customers?.name ?? "Unknown customer"}</Text>
            <Text style={styles.rowSubtitle}>
              {STATUS_LABELS[item.status]} · {formatCurrency(item.total_amount)}
            </Text>
          </Pressable>
        )}
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
