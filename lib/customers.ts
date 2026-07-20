import { supabase } from "./supabase";

// NOTE: `customers`/`properties` column names beyond id/business_id/user_id/
// created_at aren't defined anywhere in this repo's migrations (those only
// add business_id to tables assumed to already exist). name/email/phone and
// address/notes below are reasonable CRM defaults, not confirmed against the
// real project's schema — adjust the `select`/`insert` column lists here if
// they don't match.

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export type Property = {
  id: string;
  customer_id: string;
  address: string;
  notes: string | null;
  created_at: string;
};

const CUSTOMER_COLUMNS = "id, name, email, phone, created_at";
const PROPERTY_COLUMNS = "id, customer_id, address, notes, created_at";

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
  businessId: string;
  userId: string;
}): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: input.name,
      email: input.email,
      phone: input.phone,
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
  updates: Partial<Pick<Customer, "name" | "email" | "phone">>
): Promise<void> {
  const { error } = await supabase.from("customers").update(updates).eq("id", id);
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
  notes: string | null;
  businessId: string;
  userId: string;
}): Promise<Property> {
  const { data, error } = await supabase
    .from("properties")
    .insert({
      customer_id: input.customerId,
      address: input.address,
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
  updates: Partial<Pick<Property, "address" | "notes">>
): Promise<void> {
  const { error } = await supabase.from("properties").update(updates).eq("id", id);
  if (error) throw error;
}
