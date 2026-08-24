import { supabase } from "./supabase";
import { withRetry } from "./retry";

export type JobStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export type Job = {
  id: string;
  customer_id: string;
  property_id: string | null;
  quote_id: string | null;
  title: string;
  status: JobStatus;
  scheduled_date: string | null;
  estimated_price: number | null;
  final_price: number | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JobWithCustomer = Job & {
  customers: { name: string } | null;
  properties: { address: string } | null;
};

const JOB_COLUMNS =
  "id, customer_id, property_id, quote_id, title, status, scheduled_date, estimated_price, final_price, notes, completed_at, created_at, updated_at";

export async function listJobs(): Promise<JobWithCustomer[]> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select(`${JOB_COLUMNS}, customers(name), properties(address)`)
      .order("scheduled_date", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data as unknown as JobWithCustomer[];
  });
}

export async function getJob(id: string): Promise<JobWithCustomer> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select(`${JOB_COLUMNS}, customers(name), properties(address)`)
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as unknown as JobWithCustomer;
  });
}

export async function listJobsForCustomer(customerId: string): Promise<Job[]> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select(JOB_COLUMNS)
      .eq("customer_id", customerId)
      .order("scheduled_date", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data;
  });
}

/** The job already created from a given quote, if any -- lets the quote detail screen offer "View Job" instead of creating a duplicate. */
export async function getJobForQuote(quoteId: string): Promise<Job | null> {
  return withRetry(async () => {
    const { data, error } = await supabase.from("jobs").select(JOB_COLUMNS).eq("quote_id", quoteId).maybeSingle();
    if (error) throw error;
    return data;
  });
}

export async function createJob(input: {
  customerId: string;
  propertyId: string | null;
  quoteId: string | null;
  title: string;
  scheduledDate: string | null;
  estimatedPrice: number | null;
  notes: string | null;
  businessId: string;
  userId: string;
}): Promise<Job> {
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      customer_id: input.customerId,
      property_id: input.propertyId,
      quote_id: input.quoteId,
      title: input.title,
      scheduled_date: input.scheduledDate,
      estimated_price: input.estimatedPrice,
      notes: input.notes,
      business_id: input.businessId,
      user_id: input.userId,
    })
    .select(JOB_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function updateJob(
  id: string,
  updates: Partial<
    Pick<Job, "title" | "status" | "scheduled_date" | "estimated_price" | "final_price" | "notes">
  >
): Promise<void> {
  const { error } = await supabase
    .from("jobs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Marks a job completed (or reopens it), keeping completed_at in sync with status. */
export async function setJobCompleted(id: string, completed: boolean, finalPrice: number | null): Promise<void> {
  const { error } = await supabase
    .from("jobs")
    .update({
      status: completed ? "completed" : "scheduled",
      completed_at: completed ? new Date().toISOString() : null,
      final_price: finalPrice,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}
