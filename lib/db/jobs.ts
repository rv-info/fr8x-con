/**
 * lib/db/jobs.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Supabase PostgreSQL Database Module for Logistics Jobs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDbClient } from '@/lib/supabase/server';
import { JobRow } from '@/lib/supabase/types';

export interface ContactEmailItem {
  email: string;
  label?: string;
  isPrimary?: boolean;
}

export function packJobDescription(job: any): string {
  const envelope = {
    text: job.description || '',
    category: job.category || '',
    vacancies: job.vacancies || 1,
    contactPerson: job.contactPerson || '',
    contactDesignation: job.contactDesignation || '',
    companyWebsite: job.companyWebsite || '',
    whatsappNumber: job.whatsappNumber || '',
    posterEmail: job.posterEmail || '',
    contactEmails: job.contactEmails || [],
    contactPhone: job.contactPhone || '',
    hasWhatsApp: Boolean(job.hasWhatsApp),
    applicationInstructions: job.applicationInstructions || '',
    applicationMethod: job.applicationMethod || 'both',
    experience: job.experience || '',
    skills: job.skills || [],
    closingDate: job.closingDate || '',
    packageDetails: job.packageDetails || job.salaryRange || job.salary_range || '',
    responsibilities: job.responsibilities || '',
    qualifications: job.qualifications || '',
    tariffDuration: job.tariffDuration || 2,
    isAutoRenew: Boolean(job.isAutoRenew),
    postedBy: job.postedBy || '',
    postedByUid: job.postedByUid || job.posterUid || '',
    postedDate: job.postedDate || '',
    paymentStatus: job.paymentStatus || 'unpaid',
    paidAmount: job.paidAmount || 0,
  };
  return JSON.stringify(envelope);
}

export function unpackJobData(row: any): any {
  if (!row) return row;
  let parsedDesc = row.description;
  let extraMeta: any = {};
  if (row.description && typeof row.description === 'string' && row.description.trim().startsWith('{')) {
    try {
      extraMeta = JSON.parse(row.description);
      parsedDesc = extraMeta.text || '';
    } catch {}
  }

  return {
    ...row,
    ...extraMeta,
    id: row.id,
    title: row.title,
    company: row.company_name || extraMeta.company || 'Enterprise Logistics',
    companyId: row.company_id || extraMeta.companyId || null,
    location: row.location || 'Pan-India',
    employmentType: row.job_type || extraMeta.employmentType || 'Full-time',
    category: extraMeta.category || 'Ocean Freight & Logistics',
    vacancies: extraMeta.vacancies || 1,
    contactPerson: extraMeta.contactPerson || '',
    contactDesignation: extraMeta.contactDesignation || '',
    companyWebsite: extraMeta.companyWebsite || '',
    whatsappNumber: extraMeta.whatsappNumber || extraMeta.contactPhone || '',
    description: parsedDesc || '',
    requirements: row.requirements || extraMeta.requirements || '',
    packageDetails: row.salary_range || extraMeta.packageDetails || '',
    status: row.status || 'active',
    posterEmail: extraMeta.posterEmail || '',
    contactEmails: extraMeta.contactEmails || (extraMeta.posterEmail ? [{ email: extraMeta.posterEmail, label: 'Primary Recruiter', isPrimary: true }] : []),
    contactPhone: extraMeta.contactPhone || '',
    hasWhatsApp: Boolean(extraMeta.hasWhatsApp),
    applicationInstructions: extraMeta.applicationInstructions || '',
    applicationMethod: extraMeta.applicationMethod || 'both',
    experience: extraMeta.experience || '',
    skills: extraMeta.skills || [],
    closingDate: extraMeta.closingDate || '',
    responsibilities: extraMeta.responsibilities || '',
    qualifications: extraMeta.qualifications || '',
    postedBy: extraMeta.postedBy || row.company_name || 'Enterprise Recruiter',
    postedByUid: extraMeta.postedByUid || null,
    postedDate: extraMeta.postedDate || (row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''),
    paymentStatus: extraMeta.paymentStatus || (row.status === 'active' ? 'paid' : 'unpaid'),
    paidAmount: extraMeta.paidAmount || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getJobs(): Promise<any[]> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[lib/db/jobs] getJobs error:', error.message);
    throw new Error(`Failed to get jobs: ${error.message}`);
  }
  return (data || []).map(unpackJobData);
}

export async function saveJob(job: any): Promise<any> {
  const supabase = getDbClient();
  const packedDescription = packJobDescription(job);

  const payload = {
    id: job.id || `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: job.title || 'Logistics Professional',
    company_id: job.companyId || job.company_id || null,
    company_name: job.companyName || job.company_name || job.company || 'Enterprise Logistics',
    location: job.location || 'Pan-India',
    job_type: job.jobType || job.job_type || job.employmentType || 'Full-time',
    description: packedDescription,
    requirements: job.requirements || '',
    salary_range: job.salaryRange || job.salary_range || job.packageDetails || null,
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
  return unpackJobData(data);
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
