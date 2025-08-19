import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Environment Check:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING',
  allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
});

// Create a mock client if environment variables are missing
let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please create a .env file with:');
  console.error('VITE_SUPABASE_URL=your_supabase_project_url');
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
  
  // Create a mock client that throws helpful errors
  supabase = {
    from: () => ({
      select: () => ({
        order: () => Promise.reject(new Error('Missing Supabase environment variables. Please check your .env file.'))
      }),
      insert: () => Promise.reject(new Error('Missing Supabase environment variables. Please check your .env file.')),
      update: () => Promise.reject(new Error('Missing Supabase environment variables. Please check your .env file.')),
      delete: () => Promise.reject(new Error('Missing Supabase environment variables. Please check your .env file.'))
    }),
    channel: () => ({
      on: () => ({
        subscribe: () => ({
          unsubscribe: () => {}
        })
      })
    })
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

// Database types
export interface DatabaseExpense {
  id: string;
  created_at: string;
  description: string;
  amount: number;
  paid_by: string;
  date: string;
  time: string;
  split_amount: number;
  category?: string;
  split_type: string;
  custom_splits?: any;
  is_loan: boolean;
  loan_to?: string[];
  notes?: string;
}

export interface DatabaseShoppingItem {
  id: string;
  created_at: string;
  name: string;
  completed: boolean;
  added_by: string;
  date: string;
}