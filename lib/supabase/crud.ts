/**
 * lib/supabase/crud.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Standard Reusable CRUD Foundation for FR8X Supabase Architecture.
 * Provides strongly-typed, RLS-respecting, normalized CRUD primitives
 * with centralized error handling.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';
import { handleSupabaseError, NotFoundError } from './errors';
import { getSupabaseBrowserClient } from './client';

export type TableName = keyof Database['public']['Tables'];
export type Row<T extends TableName> = Database['public']['Tables'][T]['Row'];
export type InsertPayload<T extends TableName> = Database['public']['Tables'][T]['Insert'];
export type UpdatePayload<T extends TableName> = Database['public']['Tables'][T]['Update'];

export interface QueryOptions {
  select?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
}

export class CrudRepository<T extends TableName> {
  protected tableName: T;
  protected getClient: () => SupabaseClient<Database>;

  constructor(tableName: T, clientProvider?: () => SupabaseClient<Database>) {
    this.tableName = tableName;
    this.getClient = clientProvider || (() => getSupabaseBrowserClient() as unknown as SupabaseClient<Database>);
  }

  /**
   * Find a single record by its primary key ID.
   */
  async findById(id: string, select = '*'): Promise<Row<T> | null> {
    try {
      const client = this.getClient();
      const { data, error } = await (client.from(this.tableName) as any)
        .select(select)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw handleSupabaseError(error, `${this.tableName}.findById`);
      }

      return data as Row<T> | null;
    } catch (err) {
      throw handleSupabaseError(err, `${this.tableName}.findById`);
    }
  }

  /**
   * Find a single record by its primary key ID or throw NotFoundError.
   */
  async findByIdOrThrow(id: string, select = '*'): Promise<Row<T>> {
    const record = await this.findById(id, select);
    if (!record) {
      throw new NotFoundError(this.tableName, id);
    }
    return record;
  }

  /**
   * Query records matching simple equality filters with optional ordering and pagination.
   */
  async findMany(
    filters: Partial<Row<T>> = {},
    options: QueryOptions = {}
  ): Promise<Row<T>[]> {
    try {
      const client = this.getClient();
      let query = (client.from(this.tableName) as any).select(options.select || '*');

      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      }

      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true });
      }

      if (options.limit !== undefined) {
        query = query.limit(options.limit);
      }

      if (options.offset !== undefined) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;
      if (error) {
        throw handleSupabaseError(error, `${this.tableName}.findMany`);
      }

      return (data || []) as Row<T>[];
    } catch (err) {
      throw handleSupabaseError(err, `${this.tableName}.findMany`);
    }
  }

  /**
   * Insert a new record into PostgreSQL and return the created record.
   */
  async insert(payload: InsertPayload<T>): Promise<Row<T>> {
    try {
      const client = this.getClient();
      const { data, error } = await (client.from(this.tableName) as any)
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error, `${this.tableName}.insert`);
      }

      return data as Row<T>;
    } catch (err) {
      throw handleSupabaseError(err, `${this.tableName}.insert`);
    }
  }

  /**
   * Update an existing record by its primary key ID and return the confirmed updated record.
   */
  async update(id: string, payload: UpdatePayload<T>): Promise<Row<T>> {
    try {
      const client = this.getClient();
      const { data, error } = await (client.from(this.tableName) as any)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error, `${this.tableName}.update`);
      }

      return data as Row<T>;
    } catch (err) {
      throw handleSupabaseError(err, `${this.tableName}.update`);
    }
  }

  /**
   * Delete a record by its primary key ID.
   */
  async deleteById(id: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const { error } = await (client.from(this.tableName) as any)
        .delete()
        .eq('id', id);

      if (error) {
        throw handleSupabaseError(error, `${this.tableName}.deleteById`);
      }

      return true;
    } catch (err) {
      throw handleSupabaseError(err, `${this.tableName}.deleteById`);
    }
  }
}

/**
 * Creates a reusable typed CrudRepository for any valid Supabase table.
 */
export function createCrudRepository<T extends TableName>(
  tableName: T,
  clientProvider?: () => SupabaseClient<Database>
): CrudRepository<T> {
  return new CrudRepository<T>(tableName, clientProvider);
}
