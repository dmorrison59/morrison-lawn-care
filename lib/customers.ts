import { supabase } from "./supabase";

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Property = {
  id: string;
  customer_id: string;
  address: string;
  square_footage: number | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const CUSTOMER_COLUMNS = "id, name, email, phone, address, notes, created_at, updated_at";
const PROPERTY_COLUMNS =
  "id, customer_id, address, square_footage, latitude, longitude, notes, created_at, updated_at";

export async function listCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from("customers").select(CUSTOMER_COLUMNS).order("name");
  if (error) throw error;
  return data;
}

export async function getCustomer(id: string): Promise<Customer> {
  const { data, error } = await supabase.from("customers").select(CUSTOMER_COLUMNS).eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createCustomer(input: {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  businessId: string;
  userId: string;
}): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      notes: input.notes,
      business_id: input.businessId,
      user_id: input.userId,
    })
    .select(CUSTOMER_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function updateCustomer(
  id: string,
  updates: Partial<Pick<Customer, "name" | "email" | "phone" | "address" | "notes">>
): Promise<void> {
  const { error } = await supabase
    .from("customers")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function listProperties(customerId: string): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_COLUMNS)
    .eq("customer_id", customerId)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function createProperty(input: {
  customerId: string;
  address: string;
  squareFootage: number | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  businessId: string;
  userId: string;
}): Promise<Property> {
  const { data, error } = await supabase
    .from("properties")
    .insert({
      customer_id: input.customerId,
      address: input.address,
      square_footage: input.squareFootage,
      latitude: input.latitude,
      longitude: input.longitude,
      notes: input.notes,
      business_id: input.businessId,
      user_id: input.userId,
    })
    .select(PROPERTY_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProperty(
  id: string,
  updates: Partial<Pick<Property, "address" | "square_footage" | "latitude" | "longitude" | "notes">>
): Promise<void> {
  const { error } = await supabase
    .from("properties")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
