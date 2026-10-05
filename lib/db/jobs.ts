/**
 * lib/db/jobs.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Supabase PostgreSQL Database Module for Logistics Jobs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDbClient } from '@/lib/supabase/server';
import { JobRow } from '@/lib/supabase/types';

export async function getJobs(): Promise<JobRow[]> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[lib/db/jobs] getJobs error:', error.message);
    throw new Error(`Failed to get jobs: ${error.message}`);
  }
  return data || [];
}

export async function saveJob(job: any): Promise<JobRow> {
  const supabase = getDbClient();
  const payload = {
    id: job.id || `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: job.title || 'Logistics Professional',
    company_id: job.companyId || job.company_id || null,
    company_name: job.companyName || job.company_name || job.company || 'Enterprise Logistics',
    location: job.location || 'Pan-India',
    job_type: job.jobType || job.job_type || 'Full-time',
    description: job.description || '',
    requirements: job.requirements || '',
    salary_range: job.salaryRange || job.salary_range || null,
    status: job.status || 'active',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('jobs')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[lib/db/jobs] saveJob error:', error.message);
    throw new Error(`Failed to save job: ${error.message}`);
  }
  return data;
}

export async function deleteJob(id: string): Promise<boolean> {
  const supabase = getDbClient();
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[lib/db/jobs] deleteJob error:', error.message);
    throw new Error(`Failed to delete job: ${error.message}`);
  }
  return true;
}
