import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";

import { AddressAutocompleteInput } from "@/components/AddressAutocompleteInput";
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

function parseOptionalNumber(text: string): number | null | undefined {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, business } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const [properties, setProperties] = useState<Property[]>([]);

  const [addingProperty, setAddingProperty] = useState(false);
  const [sameAsCustomerAddress, setSameAsCustomerAddress] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newSquareFootage, setNewSquareFootage] = useState("");
  const [newLatitude, setNewLatitude] = useState("");
  const [newLongitude, setNewLongitude] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [savingProperty, setSavingProperty] = useState(false);

  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(
    null,
  );
  const [editAddress, setEditAddress] = useState("");
  const [editSquareFootage, setEditSquareFootage] = useState("");
  const [editLatitude, setEditLatitude] = useState("");
  const [editLongitude, setEditLongitude] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [customerData, propertiesData] = await Promise.all([
        getCustomer(id),
        listProperties(id),
      ]);
      setCustomer(customerData);
      setName(customerData.name);
      setEmail(customerData.email ?? "");
      setPhone(customerData.phone ?? "");
      setAddress(customerData.address ?? "");
      setNotes(customerData.notes ?? "");
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
    }, [load]),
  );

  const onSaveCustomer = async () => {
    setSavingCustomer(true);
    setError(null);
    try {
      await updateCustomer(id, {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save customer");
    } finally {
      setSavingCustomer(false);
    }
  };

  const resetNewPropertyFields = () => {
    setAddingProperty(false);
    setSameAsCustomerAddress(false);
    setNewAddress("");
    setNewSquareFootage("");
    setNewLatitude("");
    setNewLongitude("");
    setNewNotes("");
  };

  const toggleSameAsCustomerAddress = () => {
    if (!customer?.address) return;
    const next = !sameAsCustomerAddress;
    setSameAsCustomerAddress(next);
    setNewAddress(next ? customer.address : "");
  };

  const onAddProperty = async () => {
    if (!business || !session) return;

    const squareFootage = parseOptionalNumber(newSquareFootage);
    const latitude = parseOptionalNumber(newLatitude);
    const longitude = parseOptionalNumber(newLongitude);
    if (
      squareFootage === undefined ||
      latitude === undefined ||
      longitude === undefined
    ) {
      setError("Square footage, latitude, and longitude must be numbers");
      return;
    }

    setError(null);
    setSavingProperty(true);
    try {
      const property = await createProperty({
        customerId: id,
        address: newAddress.trim(),
        squareFootage,
        latitude,
        longitude,
        notes: newNotes.trim() || null,
        businessId: business.id,
        userId: session.user.id,
      });
      setProperties((prev) => [...prev, property]);
      resetNewPropertyFields();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add property");
    } finally {
      setSavingProperty(false);
    }
  };

  const startEditingProperty = (property: Property) => {
    setEditingPropertyId(property.id);
    setEditAddress(property.address);
    setEditSquareFootage(property.square_footage?.toString() ?? "");
    setEditLatitude(property.latitude?.toString() ?? "");
    setEditLongitude(property.longitude?.toString() ?? "");
    setEditNotes(property.notes ?? "");
  };

  const onSaveProperty = async (propertyId: string) => {
    const squareFootage = parseOptionalNumber(editSquareFootage);
    const latitude = parseOptionalNumber(editLatitude);
    const longitude = parseOptionalNumber(editLongitude);
    if (
      squareFootage === undefined ||
      latitude === undefined ||
      longitude === undefined
    ) {
      setError("Square footage, latitude, and longitude must be numbers");
      return;
    }

    setError(null);
    setSavingProperty(true);
    try {
      const updates = {
        address: editAddress.trim(),
        square_footage: squareFootage,
        latitude,
        longitude,
        notes: editNotes.trim() || null,
      };
      await updateProperty(propertyId, updates);
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, ...updates } : p)),
      );
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

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
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
        <AddressAutocompleteInput
          style={styles.input}
          placeholder="Address"
          value={address}
          onChangeText={setAddress}
        />
        <TextInput
          style={styles.input}
          placeholder="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[
            styles.button,
            (savingCustomer || !name.trim()) && styles.buttonDisabled,
          ]}
          onPress={onSaveCustomer}
          disabled={savingCustomer || !name.trim()}
        >
          {savingCustomer ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save</Text>
          )}
        </Pressable>

        <Text style={[styles.sectionTitle, styles.propertiesTitle]}>
          Properties
        </Text>

        {properties.length === 0 && !addingProperty && (
          <Text style={styles.empty}>No properties yet.</Text>
        )}

        {properties.map((property) =>
          editingPropertyId === property.id ? (
            <View key={property.id} style={styles.propertyCard}>
              <AddressAutocompleteInput
                style={styles.input}
                placeholder="Address"
                value={editAddress}
                onChangeText={setEditAddress}
                onSelectPlace={(place) => {
                  setEditLatitude(place.latitude.toString());
                  setEditLongitude(place.longitude.toString());
                }}
              />
              <TextInput
                style={styles.input}
                placeholder="Square footage"
                keyboardType="numeric"
                value={editSquareFootage}
                onChangeText={setEditSquareFootage}
              />
              <TextInput
                style={styles.input}
                placeholder="Latitude"
                value={editLatitude}
                onChangeText={setEditLatitude}
              />
              <TextInput
                style={styles.input}
                placeholder="Longitude"
                value={editLongitude}
                onChangeText={setEditLongitude}
              />
              <TextInput
                style={styles.input}
                placeholder="Notes"
                value={editNotes}
                onChangeText={setEditNotes}
                multiline
              />
              <View style={styles.propertyActions}>
                <Pressable
                  onPress={() => setEditingPropertyId(null)}
                  style={styles.secondaryButton}
                >
                  <Text>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.button,
                    styles.smallButton,
                    (savingProperty || !editAddress.trim()) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={() => onSaveProperty(property.id)}
                  disabled={savingProperty || !editAddress.trim()}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              key={property.id}
              style={styles.propertyCard}
              onPress={() => startEditingProperty(property)}
            >
              <Text style={styles.rowTitle}>{property.address}</Text>
              {property.square_footage != null && (
                <Text style={styles.rowSubtitle}>
                  {property.square_footage.toLocaleString()} sq ft
                </Text>
              )}
              {property.latitude != null && property.longitude != null && (
                <Text style={styles.rowSubtitle}>
                  {property.latitude}, {property.longitude}
                </Text>
              )}
              {property.notes && (
                <Text style={styles.rowSubtitle}>{property.notes}</Text>
              )}
            </Pressable>
          ),
        )}

        {addingProperty ? (
          <View style={styles.propertyCard}>
            <Pressable
              style={styles.checkboxRow}
              onPress={toggleSameAsCustomerAddress}
              disabled={!customer.address}
            >
              <View
                style={[
                  styles.checkbox,
                  sameAsCustomerAddress && styles.checkboxChecked,
                ]}
              >
                {sameAsCustomerAddress && (
                  <Text style={styles.checkboxMark}>✓</Text>
                )}
              </View>
              <Text
                style={[
                  styles.checkboxLabel,
                  !customer.address && styles.checkboxLabelDisabled,
                ]}
              >
                Same as customer address
              </Text>
            </Pressable>
            <AddressAutocompleteInput
              style={styles.input}
              placeholder="Address"
              value={newAddress}
              onChangeText={setNewAddress}
              onSelectPlace={(place) => {
                setNewLatitude(place.latitude.toString());
                setNewLongitude(place.longitude.toString());
              }}
              editable={!sameAsCustomerAddress}
            />
            <TextInput
              style={styles.input}
              placeholder="Square footage"
              keyboardType="numeric"
              value={newSquareFootage}
              onChangeText={setNewSquareFootage}
            />
            <TextInput
              style={styles.input}
              placeholder="Latitude"
              value={newLatitude}
              onChangeText={setNewLatitude}
            />
            <TextInput
              style={styles.input}
              placeholder="Longitude"
              value={newLongitude}
              onChangeText={setNewLongitude}
            />
            <TextInput
              style={styles.input}
              placeholder="Notes"
              value={newNotes}
              onChangeText={setNewNotes}
              multiline
            />
            <View style={styles.propertyActions}>
              <Pressable
                onPress={resetNewPropertyFields}
                style={styles.secondaryButton}
              >
                <Text>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.button,
                  styles.smallButton,
                  (savingProperty || !newAddress.trim()) &&
                    styles.buttonDisabled,
                ]}
                onPress={onAddProperty}
                disabled={savingProperty || !newAddress.trim()}
              >
                <Text style={styles.buttonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={styles.secondaryButton}
            onPress={() => setAddingProperty(true)}
          >
            <Text style={styles.addPropertyText}>+ Add property</Text>
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#2f6f4e",
    borderColor: "#2f6f4e",
  },
  checkboxMark: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 14,
  },
  checkboxLabel: {
    fontSize: 14,
  },
  checkboxLabelDisabled: {
    opacity: 0.4,
  },
});
