/**
 * lib/db/transactions.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Supabase PostgreSQL Database Module for Payment Transactions.
 * Records Razorpay orders, subscription invoices, credits, and refunds.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDbClient } from '@/lib/supabase/server';
import { TransactionRow } from '@/lib/supabase/types';

export async function getTransactions(filter?: { userId?: string; orderId?: string; status?: string }): Promise<TransactionRow[]> {
  const supabase = getDbClient();
  let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });

  if (filter?.userId) {
    query = query.eq('user_id', filter.userId);
  }
  if (filter?.orderId) {
    query = query.eq('order_id', filter.orderId);
  }
  if (filter?.status) {
    query = query.eq('status', filter.status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[lib/db/transactions] getTransactions error:', error.message);
    throw new Error(`Failed to get transactions: ${error.message}`);
  }
  return data || [];
}

export async function getTransactionById(id: string): Promise<TransactionRow | null> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[lib/db/transactions] getTransactionById error:', error.message);
    throw new Error(`Failed to get transaction by id: ${error.message}`);
  }
  return data;
}

export async function saveTransaction(tx: any): Promise<TransactionRow> {
  const supabase = getDbClient();
  const payload = {
    id: tx.id || `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    order_id: tx.orderId || tx.order_id,
    payment_id: tx.paymentId || tx.payment_id || null,
    user_id: tx.userId || tx.user_id || null,
    user_email: tx.userEmail || tx.user_email || null,
    amount: Number(tx.amount) || 0,
    currency: tx.currency || 'INR',
    plan_id: tx.planId || tx.plan_id || null,
    item_type: tx.itemType || tx.item_type || 'subscription',
    item_title: tx.itemTitle || tx.item_title || 'FR8X Plan',
    status: tx.status || 'created',
    gateway: tx.gateway || 'Razorpay',
    raw_payload: tx.rawPayload || tx.raw_payload || {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('transactions')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[lib/db/transactions] saveTransaction error:', error.message);
    throw new Error(`Failed to save transaction: ${error.message}`);
  }
  return data;
}
