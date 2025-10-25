

const SUPABASE_URL = "https://rdnsszxtxsfzlnkvjcen.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbnNzenh0eHNmemxua3ZqY2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMzQzNDMsImV4cCI6MjA3NjgxMDM0M30.s9ny3hKI0SqMlu8Tv3F1CVBJKfy0Pakz5DAE-bv5Vfg";

// The page includes supabase-js from CDN, which exposes `supabase`
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabase; // global
