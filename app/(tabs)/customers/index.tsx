import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
} from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";

import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { Text } from "@/components/Themed";
import { listCustomers, type Customer } from "@/lib/customers";

export default function CustomersListScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      listCustomers()
        .then((data) => {
          if (!cancelled) setCustomers(data);
        })
        .catch((e) => {
          if (!cancelled)
            setError(
              e instanceof Error ? e.message : "Failed to load customers",
            );
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
            <Pressable
              onPress={() => router.push("/(tabs)/customers/new")}
              hitSlop={12}
            >
              <Text style={styles.addButton}>Add</Text>
            </Pressable>
          ),
        }}
      />

      {loading && <ActivityIndicator style={styles.loading} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {!loading && !error && customers.length === 0 && (
        <Text style={styles.empty}>
          No customers yet. Tap Add to create one.
        </Text>
      )}

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/(tabs)/customers/${item.id}`)}
          >
            <Text style={styles.rowTitle}>{item.name}</Text>
            {(item.email || item.phone) && (
              <Text style={styles.rowSubtitle}>
                {[item.email, item.phone].filter(Boolean).join(" · ")}
              </Text>
            )}
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
