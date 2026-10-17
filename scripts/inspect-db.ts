import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function main() {
  const env: Record<string, string> = {};
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const eq = line.indexOf('=');
      if (eq > 0) {
        let val = line.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[line.slice(0, eq).trim()] = val;
      }
    }
  }

  const url = env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
  const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  console.log('Supabase URL:', url);
  console.log('Has Anon Key:', Boolean(key));
  console.log('Has Service Role Key:', Boolean(serviceKey));

  const client = createClient(url, serviceKey || key);
  
  console.log('\n--- Fetching profiles table ---');
  const { data: profiles, error: pError } = await client
    .from('profiles')
    .select('id, email, display_name, first_name, last_name, company_name, city, state, country, created_at, updated_at');
  
  if (pError) {
    console.error('Error fetching profiles:', pError);
  } else {
    console.log(`Found ${profiles?.length || 0} profiles:`);
    console.log(JSON.stringify(profiles, null, 2));
  }

  console.log('\n--- Fetching connection_requests / connections ---');
  const { data: conns, error: cError } = await client
    .from('connections')
    .select('*')
    .limit(10);
  if (cError) {
    console.log('connections error (or table does not exist):', cError.message);
  } else {
    console.log(`Found ${conns?.length || 0} connections`);
  }

  const { data: reqs, error: rError } = await client
    .from('connection_requests')
    .select('*')
    .limit(10);
  if (rError) {
    console.log('connection_requests error:', rError.message);
  } else {
    console.log(`Found ${reqs?.length || 0} connection_requests`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Diagnostic error:', err);
  process.exit(1);
});
