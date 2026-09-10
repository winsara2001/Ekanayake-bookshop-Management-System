import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://czvgxierckxxssqedawm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6dmd4aWVyY2t4eHNzcWVkYXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDg4NTgsImV4cCI6MjEwMTIyNDg1OH0.SyejgnfFgxCGWTP7u71rWXtHzRvaXl0RzeeV92qWoZo'
);

async function test() {
  const { data, error } = await supabase.auth.resetPasswordForEmail('newtest2026@gmail.com', {
    redirectTo: 'http://localhost:5173/reset-password',
  });
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}

test();
