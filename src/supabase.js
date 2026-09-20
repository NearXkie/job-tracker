import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

const isPlaceholderCredentials = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.includes('your-project-id') || 
  supabaseAnonKey.includes('your-actual-anon-key');

export const supabase = (!isPlaceholderCredentials && supabaseUrl.startsWith('http'))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mock database storage for preview/demo when real Supabase is not connected
const MOCK_STORAGE_KEY = 'jobtracker_mock_db_v3';

const defaultMockData = {
  sectors: [
    { id: 1, name: 'Technology & Software' },
    { id: 2, name: 'Fintech & Banking' },
    { id: 3, name: 'Healthcare & Biotech' },
    { id: 4, name: 'E-commerce & Retail' },
    { id: 5, name: 'Consulting & Professional Services' },
  ],
  job_types: [
    { id: 1, name: 'Full-time' },
    { id: 2, name: 'Contract' },
    { id: 3, name: 'Part-time' },
    { id: 4, name: 'Internship' },
    { id: 5, name: 'Remote / Freelance' },
  ],
  statuses: [
    { id: 1, name: 'Applied', badge_color: 'blue' },
    { id: 2, name: 'Screening / Assessment', badge_color: 'yellow' },
    { id: 3, name: 'Interviewing', badge_color: 'purple' },
    { id: 4, name: 'Offer Received', badge_color: 'green' },
    { id: 5, name: 'Rejected', badge_color: 'red' },
    { id: 6, name: 'Withdrawn', badge_color: 'gray' },
  ],
  companies: [
    { id: 1, name: 'Acme Corp', sector_id: 1, careers_url: 'https://acme.example.com/careers', location: 'San Francisco, CA (Hybrid)', hr_contact: 'recruiting@acme.example.com', created_at: new Date().toISOString() },
    { id: 2, name: 'NovaTech AI', sector_id: 1, careers_url: 'https://novatech.example.com/jobs', location: 'Remote', hr_contact: 'sarah.t@novatech.example.com', created_at: new Date().toISOString() },
    { id: 3, name: 'Global Payments Co', sector_id: 2, careers_url: 'https://globalpayments.example.com', location: 'New York, NY', hr_contact: 'talent@globalpayments.example.com', created_at: new Date().toISOString() },
  ],
  applications: [
    {
      id: 1,
      company_id: 2,
      job_title: 'Senior Frontend Engineer',
      job_type_id: 1,
      status_id: 3,
      listing_url: 'https://novatech.example.com/jobs/sr-frontend',
      applied_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      salary_target: '140,000 - 160,000',
      skills_required: 'React, TypeScript, Tailwind CSS, Next.js, WebSockets',
      job_description: 'We are looking for a Senior Frontend Engineer to build high-performance, real-time AI dashboards. Responsibilities include architecting client state, optimizing render cycles, and implementing fluid UI components with Tailwind CSS.',
      notes: 'Completed technical take-home test. Final rounds scheduled with VP of Eng.',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 2,
      company_id: 1,
      job_title: 'Full Stack Developer',
      job_type_id: 1,
      status_id: 1,
      listing_url: 'https://acme.example.com/careers/fs-dev',
      applied_date: new Date(Date.now() - 9 * 86400000).toISOString().split('T')[0],
      salary_target: '130,000 - 145,000',
      skills_required: 'Node.js, PostgreSQL, React, AWS, Docker',
      job_description: 'Acme Corp is hiring a Full Stack Developer to scale internal operations platforms and microservices. Minimum 4 years experience with PostgreSQL and distributed backend systems.',
      notes: 'Applied via referral from Alex M. Waiting for recruiter screen.',
      created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 9 * 86400000).toISOString(),
    },
  ],
  applications_archive: [
    {
      id: 1,
      original_application_id: 99,
      company_name: 'Apex Systems',
      job_title: 'DevOps Specialist',
      status_name: 'Rejected',
      applied_date: '2026-08-15',
      listing_url: 'https://apex.example.com/job/491',
      salary_target: '135,000',
      skills_required: 'Kubernetes, Terraform, AWS, CI/CD',
      job_description: 'Manage cloud infrastructure and automated deployment pipelines.',
      notes: 'Position closed due to internal candidate.',
      archived_at: '2026-09-01T14:22:00Z',
    }
  ],
};

function getMockDb() {
  try {
    const data = localStorage.getItem(MOCK_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn('Could not read mock DB from localStorage:', e);
  }
  return defaultMockData;
}

function saveMockDb(data) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Could not write mock DB to localStorage:', e);
  }
}

// Connection check with latency measurement
export async function checkSupabaseConnection() {
  if (isPlaceholderCredentials || !supabase) {
    return {
      ok: false,
      isDemo: true,
      latency: null,
      message: 'Demo Mode: Supabase credentials are placeholder or missing in .env. Interactive demo active.',
    };
  }

  const startTime = performance.now();
  try {
    const { error } = await supabase.from('statuses').select('id', { count: 'exact', head: true });
    const latency = Math.round(performance.now() - startTime);

    if (error) {
      console.warn('Supabase test query error:', error);
      return {
        ok: false,
        isDemo: true,
        latency,
        message: `Connected but table query failed: ${error.message}. Using demo mode.`,
      };
    }
    return {
      ok: true,
      isDemo: false,
      latency,
      message: `Connected to Supabase (${latency}ms latency)`,
    };
  } catch (err) {
    const latency = Math.round(performance.now() - startTime);
    console.error('Supabase connection check failed:', err);
    return {
      ok: false,
      isDemo: true,
      latency,
      message: `Connection error: ${err.message}. Falling back to demo mode.`,
    };
  }
}

// Sectors
export async function fetchSectors() {
  if (!supabase) return getMockDb().sectors;
  const { data, error } = await supabase.from('sectors').select('*').order('name');
  if (error) {
    console.warn('Error fetching sectors, using fallback:', error);
    return getMockDb().sectors;
  }
  return data;
}

// Job Types
export async function fetchJobTypes() {
  if (!supabase) return getMockDb().job_types;
  const { data, error } = await supabase.from('job_types').select('*').order('name');
  if (error) {
    console.warn('Error fetching job_types, using fallback:', error);
    return getMockDb().job_types;
  }
  return data;
}

// Statuses
export async function fetchStatuses() {
  if (!supabase) return getMockDb().statuses;
  const { data, error } = await supabase.from('statuses').select('*').order('id');
  if (error) {
    console.warn('Error fetching statuses, using fallback:', error);
    return getMockDb().statuses;
  }
  return data;
}

// Companies
export async function fetchCompanies() {
  if (!supabase) return getMockDb().companies;
  const { data, error } = await supabase
    .from('companies')
    .select('*, sectors(name)')
    .order('name');
  if (error) {
    console.warn('Error fetching companies, using fallback:', error);
    return getMockDb().companies;
  }
  return data;
}

export async function createCompany(companyData) {
  if (!supabase) {
    const db = getMockDb();
    const newCompany = {
      id: Date.now(),
      ...companyData,
      created_at: new Date().toISOString(),
    };
    db.companies.push(newCompany);
    saveMockDb(db);
    return newCompany;
  }
  const { data, error } = await supabase
    .from('companies')
    .insert([companyData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Applications (includes job_description, skills_required, updated_at)
export async function fetchApplications() {
  if (!supabase) {
    const db = getMockDb();
    return db.applications.map((app) => ({
      ...app,
      companies: db.companies.find((c) => c.id === Number(app.company_id)) || null,
      job_types: db.job_types.find((t) => t.id === Number(app.job_type_id)) || null,
      statuses: db.statuses.find((s) => s.id === Number(app.status_id)) || null,
    }));
  }

  // Try fetching all columns including job_description and skills_required
  const { data, error } = await supabase
    .from('applications')
    .select(`
      id,
      job_title,
      listing_url,
      applied_date,
      salary_target,
      notes,
      job_description,
      skills_required,
      created_at,
      updated_at,
      company_id,
      job_type_id,
      status_id,
      companies:company_id ( id, name, location, careers_url ),
      job_types:job_type_id ( id, name ),
      statuses:status_id ( id, name, badge_color )
    `)
    .order('applied_date', { ascending: false });

  if (error) {
    console.warn('Error fetching applications with extended columns, attempting fallback:', error);
    // If table doesn't have job_description yet, gracefully query standard columns
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('applications')
      .select(`
        id,
        job_title,
        listing_url,
        applied_date,
        salary_target,
        notes,
        created_at,
        updated_at,
        company_id,
        job_type_id,
        status_id,
        companies:company_id ( id, name, location, careers_url ),
        job_types:job_type_id ( id, name ),
        statuses:status_id ( id, name, badge_color )
      `)
      .order('applied_date', { ascending: false });

    if (fallbackError) {
      console.warn('Fallback error fetching applications, using mock:', fallbackError);
      const db = getMockDb();
      return db.applications.map((app) => ({
        ...app,
        companies: db.companies.find((c) => c.id === Number(app.company_id)) || null,
        job_types: db.job_types.find((t) => t.id === Number(app.job_type_id)) || null,
        statuses: db.statuses.find((s) => s.id === Number(app.status_id)) || null,
      }));
    }
    return fallbackData;
  }
  return data;
}

export async function createApplication(applicationData) {
  if (!supabase) {
    const db = getMockDb();
    const now = new Date().toISOString();
    const newApp = {
      id: Date.now(),
      ...applicationData,
      created_at: now,
      updated_at: now,
    };
    db.applications.unshift(newApp);
    saveMockDb(db);
    return newApp;
  }

  const { data, error } = await supabase
    .from('applications')
    .insert([applicationData])
    .select()
    .single();

  if (error) {
    console.warn('Error creating application with all columns, trying without optional new columns if schema differs:', error);
    // If Supabase schema lacks job_description or skills_required, try inserting core fields
    if (error.message && (error.message.includes('job_description') || error.message.includes('skills_required'))) {
      const coreData = { ...applicationData };
      delete coreData.job_description;
      delete coreData.skills_required;
      const { data: retryData, error: retryError } = await supabase
        .from('applications')
        .insert([coreData])
        .select()
        .single();
      if (retryError) throw retryError;
      return retryData;
    }
    throw error;
  }
  return data;
}

// Frictionless Inline Status Update
export async function updateApplicationStatus(id, newStatusId) {
  const now = new Date().toISOString();

  if (!supabase) {
    const db = getMockDb();
    const index = db.applications.findIndex((a) => a.id === Number(id));
    if (index !== -1) {
      db.applications[index].status_id = Number(newStatusId);
      db.applications[index].updated_at = now;
      saveMockDb(db);
      return db.applications[index];
    }
    throw new Error('Application not found');
  }

  const { data, error } = await supabase
    .from('applications')
    .update({ status_id: Number(newStatusId) })
    .eq('id', id)
    .select(`
      id,
      status_id,
      updated_at,
      statuses:status_id ( id, name, badge_color )
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function archiveApplication(app) {
  const archiveRecord = {
    original_application_id: app.id,
    company_name: app.companies?.name || app.company_name || 'Unknown Company',
    job_title: app.job_title || 'Untitled Role',
    status_name: app.statuses?.name || app.status_name || 'Archived',
    applied_date: app.applied_date || null,
    listing_url: app.listing_url || null,
    salary_target: app.salary_target || null,
    notes: app.notes || null,
    job_description: app.job_description || null,
    skills_required: app.skills_required || null,
    archived_at: new Date().toISOString(),
  };

  if (!supabase) {
    const db = getMockDb();
    const archiveItem = {
      id: Date.now(),
      ...archiveRecord,
    };
    db.applications_archive.unshift(archiveItem);
    db.applications = db.applications.filter((a) => a.id !== Number(app.id));
    saveMockDb(db);
    return archiveItem;
  }

  // 1. Insert into applications_archive
  let { data: archiveData, error: archiveError } = await supabase
    .from('applications_archive')
    .insert([archiveRecord])
    .select()
    .single();

  if (archiveError) {
    // If schema lacks job_description or skills_required in applications_archive
    if (archiveError.message && (archiveError.message.includes('job_description') || archiveError.message.includes('skills_required'))) {
      const coreArchive = { ...archiveRecord };
      delete coreArchive.job_description;
      delete coreArchive.skills_required;
      const { data: retryArchive, error: retryError } = await supabase
        .from('applications_archive')
        .insert([coreArchive])
        .select()
        .single();
      if (retryError) throw retryError;
      archiveData = retryArchive;
    } else {
      throw archiveError;
    }
  }

  // 2. Delete from applications
  const { error: deleteError } = await supabase
    .from('applications')
    .delete()
    .eq('id', app.id);

  if (deleteError) {
    console.error('Warning: Failed to delete from applications after archiving:', deleteError);
    throw deleteError;
  }

  return archiveData;
}

export async function fetchArchivedApplications() {
  if (!supabase) {
    return getMockDb().applications_archive;
  }

  const { data, error } = await supabase
    .from('applications_archive')
    .select('*')
    .order('archived_at', { ascending: false });

  if (error) {
    console.warn('Error fetching archive, using fallback:', error);
    return getMockDb().applications_archive;
  }
  return data;
}

export async function deleteArchivedApplication(id) {
  if (!supabase) {
    const db = getMockDb();
    db.applications_archive = db.applications_archive.filter((a) => a.id !== Number(id));
    saveMockDb(db);
    return true;
  }

  const { error } = await supabase
    .from('applications_archive')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}
