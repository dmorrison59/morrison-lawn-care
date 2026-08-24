import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from "react-native";
import { useFocusEffect } from "expo-router";

import { Text, View } from "@/components/Themed";
import { useAuth } from "@/lib/auth-context";
import {
  createPricingTier,
  deletePricingTier,
  listPricingTiers,
  updatePricingTier,
  type PricingTier,
} from "@/lib/pricing-tiers";

function parseOptionalNumber(text: string): number | null | undefined {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

function formatCurrency(amount: number | null): string {
  if (amount == null) return "—";
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

type TierFields = {
  name: string;
  minSqft: string;
  maxSqft: string;
  basePrice: string;
  pricePerSqft: string;
};

const EMPTY_FIELDS: TierFields = { name: "", minSqft: "", maxSqft: "", basePrice: "", pricePerSqft: "" };

function fieldsFromTier(tier: PricingTier): TierFields {
  return {
    name: tier.name,
    minSqft: tier.min_sqft?.toString() ?? "",
    maxSqft: tier.max_sqft?.toString() ?? "",
    basePrice: tier.base_price?.toString() ?? "",
    pricePerSqft: tier.price_per_sqft?.toString() ?? "",
  };
}

export default function PricingTiersScreen() {
  const { session, business } = useAuth();

  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<TierFields>(EMPTY_FIELDS);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [newFields, setNewFields] = useState<TierFields>(EMPTY_FIELDS);
  const [savingNew, setSavingNew] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTiers(await listPricingTiers());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pricing tiers");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const parseFields = (fields: TierFields) => {
    const minSqft = parseOptionalNumber(fields.minSqft);
    const maxSqft = parseOptionalNumber(fields.maxSqft);
    const basePrice = parseOptionalNumber(fields.basePrice);
    const pricePerSqft = parseOptionalNumber(fields.pricePerSqft);
    if (minSqft === undefined || maxSqft === undefined || basePrice === undefined || pricePerSqft === undefined) {
      return null;
    }
    return { minSqft, maxSqft, basePrice, pricePerSqft };
  };

  const startEditing = (tier: PricingTier) => {
    setEditingId(tier.id);
    setEditFields(fieldsFromTier(tier));
  };

  const onSaveEdit = async (id: string) => {
    const parsed = parseFields(editFields);
    if (!parsed || !editFields.name.trim()) {
      setError("Enter a name and numeric values for square footage and prices");
      return;
    }
    setError(null);
    setSavingId(id);
    try {
      const updates = {
        name: editFields.name.trim(),
        min_sqft: parsed.minSqft,
        max_sqft: parsed.maxSqft,
        base_price: parsed.basePrice,
        price_per_sqft: parsed.pricePerSqft,
      };
      await updatePricingTier(id, updates);
      setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save pricing tier");
    } finally {
      setSavingId(null);
    }
  };

  const onDelete = async (id: string) => {
    setError(null);
    try {
      await deletePricingTier(id);
      setTiers((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete pricing tier");
    }
  };

  const onAdd = async () => {
    if (!business || !session) return;
    const parsed = parseFields(newFields);
    if (!parsed || !newFields.name.trim()) {
      setError("Enter a name and numeric values for square footage and prices");
      return;
    }
    setError(null);
    setSavingNew(true);
    try {
      const tier = await createPricingTier({
        name: newFields.name.trim(),
        minSqft: parsed.minSqft,
        maxSqft: parsed.maxSqft,
        basePrice: parsed.basePrice,
        pricePerSqft: parsed.pricePerSqft,
        businessId: business.id,
        userId: session.user.id,
      });
      setTiers((prev) => [...prev, tier]);
      setNewFields(EMPTY_FIELDS);
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add pricing tier");
    } finally {
      setSavingNew(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.form}>
        <Text style={styles.intro}>
          These tiers drive how quotes get priced by lawn size. Add a tier for each square-footage range you
          charge differently for.
        </Text>

        {loading && <ActivityIndicator style={styles.loading} />}
        {error && <Text style={styles.error}>{error}</Text>}

        {!loading && tiers.length === 0 && !adding && <Text style={styles.empty}>No pricing tiers yet.</Text>}

        {tiers.map((tier) =>
          editingId === tier.id ? (
            <View key={tier.id} style={styles.card}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={editFields.name}
                onChangeText={(name) => setEditFields((f) => ({ ...f, name }))}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.rowField]}
                  placeholder="Min sq ft"
                  keyboardType="numeric"
                  value={editFields.minSqft}
                  onChangeText={(minSqft) => setEditFields((f) => ({ ...f, minSqft }))}
                />
                <TextInput
                  style={[styles.input, styles.rowField]}
                  placeholder="Max sq ft"
                  keyboardType="numeric"
                  value={editFields.maxSqft}
                  onChangeText={(maxSqft) => setEditFields((f) => ({ ...f, maxSqft }))}
                />
              </View>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.rowField]}
                  placeholder="Base price"
                  keyboardType="numeric"
                  value={editFields.basePrice}
                  onChangeText={(basePrice) => setEditFields((f) => ({ ...f, basePrice }))}
                />
                <TextInput
                  style={[styles.input, styles.rowField]}
                  placeholder="Price per sq ft"
                  keyboardType="numeric"
                  value={editFields.pricePerSqft}
                  onChangeText={(pricePerSqft) => setEditFields((f) => ({ ...f, pricePerSqft }))}
                />
              </View>
              <View style={styles.cardActions}>
                <Pressable onPress={() => setEditingId(null)} style={styles.secondaryButton}>
                  <Text>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.smallButton, savingId === tier.id && styles.buttonDisabled]}
                  onPress={() => onSaveEdit(tier.id)}
                  disabled={savingId === tier.id}
                >
                  {savingId === tier.id ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <View key={tier.id} style={styles.card}>
              <Text style={styles.rowTitle}>{tier.name}</Text>
              <Text style={styles.rowSubtitle}>
                {tier.min_sqft ?? 0}–{tier.max_sqft ?? "∞"} sq ft
              </Text>
              <Text style={styles.rowSubtitle}>
                {formatCurrency(tier.base_price)} base + {formatCurrency(tier.price_per_sqft)}/sq ft
              </Text>
              <View style={styles.cardActions}>
                <Pressable onPress={() => onDelete(tier.id)} hitSlop={8}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
                <Pressable onPress={() => startEditing(tier)} hitSlop={8}>
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
              </View>
            </View>
          ),
        )}

        {adding ? (
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={newFields.name}
              onChangeText={(name) => setNewFields((f) => ({ ...f, name }))}
              autoFocus
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.rowField]}
                placeholder="Min sq ft"
                keyboardType="numeric"
                value={newFields.minSqft}
                onChangeText={(minSqft) => setNewFields((f) => ({ ...f, minSqft }))}
              />
              <TextInput
                style={[styles.input, styles.rowField]}
                placeholder="Max sq ft"
                keyboardType="numeric"
                value={newFields.maxSqft}
                onChangeText={(maxSqft) => setNewFields((f) => ({ ...f, maxSqft }))}
              />
            </View>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.rowField]}
                placeholder="Base price"
                keyboardType="numeric"
                value={newFields.basePrice}
                onChangeText={(basePrice) => setNewFields((f) => ({ ...f, basePrice }))}
              />
              <TextInput
                style={[styles.input, styles.rowField]}
                placeholder="Price per sq ft"
                keyboardType="numeric"
                value={newFields.pricePerSqft}
                onChangeText={(pricePerSqft) => setNewFields((f) => ({ ...f, pricePerSqft }))}
              />
            </View>
            <View style={styles.cardActions}>
              <Pressable
                onPress={() => {
                  setAdding(false);
                  setNewFields(EMPTY_FIELDS);
                }}
                style={styles.secondaryButton}
              >
                <Text>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.smallButton, savingNew && styles.buttonDisabled]}
                onPress={onAdd}
                disabled={savingNew}
              >
                {savingNew ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add</Text>}
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.secondaryButton} onPress={() => setAdding(true)}>
            <Text style={styles.addText}>+ Add pricing tier</Text>
          </Pressable>
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
    gap: 10,
  },
  intro: {
    opacity: 0.7,
    marginBottom: 4,
  },
  loading: {
    marginTop: 12,
  },
  error: {
    color: "#c0392b",
  },
  empty: {
    opacity: 0.6,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  rowField: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  rowSubtitle: {
    marginTop: 2,
    opacity: 0.6,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  removeText: {
    color: "#c0392b",
    fontSize: 14,
  },
  editText: {
    color: "#2f6f4e",
    fontSize: 14,
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
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  addText: {
    color: "#2f6f4e",
    fontWeight: "600",
  },
});
