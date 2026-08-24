import { supabase } from "./supabase";
import { withRetry } from "./retry";

export type PricingTier = {
  id: string;
  name: string;
  min_sqft: number | null;
  max_sqft: number | null;
  base_price: number | null;
  price_per_sqft: number | null;
  created_at: string;
};

const PRICING_TIER_COLUMNS = "id, name, min_sqft, max_sqft, base_price, price_per_sqft, created_at";

export async function listPricingTiers(): Promise<PricingTier[]> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from("pricing_tiers")
      .select(PRICING_TIER_COLUMNS)
      .order("min_sqft", { ascending: true, nullsFirst: true });
    if (error) throw error;
    return data;
  });
}

export async function createPricingTier(input: {
  name: string;
  minSqft: number | null;
  maxSqft: number | null;
  basePrice: number | null;
  pricePerSqft: number | null;
  businessId: string;
  userId: string;
}): Promise<PricingTier> {
  const { data, error } = await supabase
    .from("pricing_tiers")
    .insert({
      name: input.name,
      min_sqft: input.minSqft,
      max_sqft: input.maxSqft,
      base_price: input.basePrice,
      price_per_sqft: input.pricePerSqft,
      business_id: input.businessId,
      user_id: input.userId,
    })
    .select(PRICING_TIER_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function updatePricingTier(
  id: string,
  updates: Partial<Pick<PricingTier, "name" | "min_sqft" | "max_sqft" | "base_price" | "price_per_sqft">>
): Promise<void> {
  const { error } = await supabase.from("pricing_tiers").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deletePricingTier(id: string): Promise<void> {
  const { error } = await supabase.from("pricing_tiers").delete().eq("id", id);
  if (error) throw error;
}
