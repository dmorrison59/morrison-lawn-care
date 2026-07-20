import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";

import { Text, View } from "@/components/Themed";
import { useAuth } from "@/lib/auth-context";
import {
  createProperty,
  getCustomer,
  listProperties,
  updateCustomer,
  updateProperty,
  type Customer,
  type Property,
} from "@/lib/customers";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, business } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const [properties, setProperties] = useState<Property[]>([]);

  const [addingProperty, setAddingProperty] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [savingProperty, setSavingProperty] = useState(false);

  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editAddress, setEditAddress] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [customerData, propertiesData] = await Promise.all([getCustomer(id), listProperties(id)]);
      setCustomer(customerData);
      setName(customerData.name);
      setEmail(customerData.email ?? "");
      setPhone(customerData.phone ?? "");
      setProperties(propertiesData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load customer");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onSaveCustomer = async () => {
    setSavingCustomer(true);
    setError(null);
    try {
      await updateCustomer(id, { name: name.trim(), email: email.trim() || null, phone: phone.trim() || null });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save customer");
    } finally {
      setSavingCustomer(false);
    }
  };

  const onAddProperty = async () => {
    if (!business || !session) return;
    setSavingProperty(true);
    try {
      const property = await createProperty({
        customerId: id,
        address: newAddress.trim(),
        notes: newNotes.trim() || null,
        businessId: business.id,
        userId: session.user.id,
      });
      setProperties((prev) => [...prev, property]);
      setNewAddress("");
      setNewNotes("");
      setAddingProperty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add property");
    } finally {
      setSavingProperty(false);
    }
  };

  const startEditingProperty = (property: Property) => {
    setEditingPropertyId(property.id);
    setEditAddress(property.address);
    setEditNotes(property.notes ?? "");
  };

  const onSaveProperty = async (propertyId: string) => {
    setSavingProperty(true);
    try {
      const updates = { address: editAddress.trim(), notes: editNotes.trim() || null };
      await updateProperty(propertyId, updates);
      setProperties((prev) => prev.map((p) => (p.id === propertyId ? { ...p, ...updates } : p)));
      setEditingPropertyId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save property");
    } finally {
      setSavingProperty(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? "Customer not found"}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: customer.name }} />

      <Text style={styles.sectionTitle}>Customer</Text>
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, (savingCustomer || !name.trim()) && styles.buttonDisabled]}
        onPress={onSaveCustomer}
        disabled={savingCustomer || !name.trim()}
      >
        {savingCustomer ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save</Text>}
      </Pressable>

      <Text style={[styles.sectionTitle, styles.propertiesTitle]}>Properties</Text>

      {properties.length === 0 && !addingProperty && <Text style={styles.empty}>No properties yet.</Text>}

      {properties.map((property) =>
        editingPropertyId === property.id ? (
          <View key={property.id} style={styles.propertyCard}>
            <TextInput style={styles.input} placeholder="Address" value={editAddress} onChangeText={setEditAddress} />
            <TextInput
              style={styles.input}
              placeholder="Notes"
              value={editNotes}
              onChangeText={setEditNotes}
              multiline
            />
            <View style={styles.propertyActions}>
              <Pressable onPress={() => setEditingPropertyId(null)} style={styles.secondaryButton}>
                <Text>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.smallButton, (savingProperty || !editAddress.trim()) && styles.buttonDisabled]}
                onPress={() => onSaveProperty(property.id)}
                disabled={savingProperty || !editAddress.trim()}
              >
                <Text style={styles.buttonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable key={property.id} style={styles.propertyCard} onPress={() => startEditingProperty(property)}>
            <Text style={styles.rowTitle}>{property.address}</Text>
            {property.notes && <Text style={styles.rowSubtitle}>{property.notes}</Text>}
          </Pressable>
        )
      )}

      {addingProperty ? (
        <View style={styles.propertyCard}>
          <TextInput style={styles.input} placeholder="Address" value={newAddress} onChangeText={setNewAddress} autoFocus />
          <TextInput style={styles.input} placeholder="Notes" value={newNotes} onChangeText={setNewNotes} multiline />
          <View style={styles.propertyActions}>
            <Pressable
              onPress={() => {
                setAddingProperty(false);
                setNewAddress("");
                setNewNotes("");
              }}
              style={styles.secondaryButton}
            >
              <Text>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.smallButton, (savingProperty || !newAddress.trim()) && styles.buttonDisabled]}
              onPress={onAddProperty}
              disabled={savingProperty || !newAddress.trim()}
            >
              <Text style={styles.buttonText}>Add</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.secondaryButton} onPress={() => setAddingProperty(true)}>
          <Text style={styles.addPropertyText}>+ Add property</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 10,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  propertiesTitle: {
    marginTop: 16,
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
  addPropertyText: {
    color: "#2f6f4e",
    fontWeight: "600",
  },
  error: {
    color: "#c0392b",
  },
  empty: {
    opacity: 0.6,
  },
  propertyCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  propertyActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
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
