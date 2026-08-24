import { supabase } from "./supabase";
import { withRetry } from "./retry";

export type QuoteStatus = "draft" | "sent" | "approved" | "declined";

export type Quote = {
  id: string;
  customer_id: string;
  property_id: string | null;
  status: QuoteStatus;
  notes: string | null;
  valid_until: string | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
};

export type QuoteWithCustomer = Quote & {
  customers: { name: string } | null;
};

export type QuoteItem = {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

const QUOTE_COLUMNS =
  "id, customer_id, property_id, status, notes, valid_until, total_amount, created_at, updated_at";
const QUOTE_ITEM_COLUMNS = "id, quote_id, description, quantity, unit_price, line_total";

export async function listQuotes(): Promise<QuoteWithCustomer[]> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from("quotes")
      .select(`${QUOTE_COLUMNS}, customers(name)`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as QuoteWithCustomer[];
  });
}

export async function listQuotesForCustomer(customerId: string): Promise<Quote[]> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from("quotes")
      .select(QUOTE_COLUMNS)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  });
}

export async function getQuote(id: string): Promise<QuoteWithCustomer> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from("quotes")
      .select(`${QUOTE_COLUMNS}, customers(name)`)
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as unknown as QuoteWithCustomer;
  });
}

export async function listQuoteItems(quoteId: string): Promise<QuoteItem[]> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from("quote_items")
      .select(QUOTE_ITEM_COLUMNS)
      .eq("quote_id", quoteId)
      .order("id");
    if (error) throw error;
    return data;
  });
}

export async function createQuote(input: {
  customerId: string;
  propertyId: string | null;
  notes: string | null;
  validUntil: string | null;
  businessId: string;
  userId: string;
}): Promise<Quote> {
  const { data, error } = await supabase
    .from("quotes")
    .insert({
      customer_id: input.customerId,
      property_id: input.propertyId,
      notes: input.notes,
      valid_until: input.validUntil,
      business_id: input.businessId,
      user_id: input.userId,
    })
    .select(QUOTE_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function updateQuote(
  id: string,
  updates: Partial<Pick<Quote, "status" | "notes" | "valid_until">>
): Promise<void> {
  const { error } = await supabase
    .from("quotes")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Recomputes and persists a quote's total_amount from the sum of its current line items. */
async function recalculateQuoteTotal(quoteId: string): Promise<void> {
  const items = await listQuoteItems(quoteId);
  const total = items.reduce((sum, item) => sum + item.line_total, 0);
  const { error } = await supabase
    .from("quotes")
    .update({ total_amount: total, updated_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (error) throw error;
}

export async function addQuoteItem(input: {
  quoteId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  businessId: string;
}): Promise<QuoteItem> {
  const lineTotal = input.quantity * input.unitPrice;
  const { data, error } = await supabase
    .from("quote_items")
    .insert({
      quote_id: input.quoteId,
      description: input.description,
      quantity: input.quantity,
      unit_price: input.unitPrice,
      line_total: lineTotal,
      business_id: input.businessId,
    })
    .select(QUOTE_ITEM_COLUMNS)
    .single();
  if (error) throw error;
  await recalculateQuoteTotal(input.quoteId);
  return data;
}

export async function deleteQuoteItem(id: string, quoteId: string): Promise<void> {
  const { error } = await supabase.from("quote_items").delete().eq("id", id);
  if (error) throw error;
  await recalculateQuoteTotal(quoteId);
}
