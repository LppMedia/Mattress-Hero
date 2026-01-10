import { createClient } from '@supabase/supabase-js';

// Use environment variables for security
// Falling back to provided keys for demo purposes only. In production, ensure these are only in .env files.
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://yjtdpxekwvaifnkmspwv.supabase.co';
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdGRweGVrd3ZhaWZua21zcHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MjQ5OTYsImV4cCI6MjA4MzQwMDk5Nn0.MDQHlLHuK6o1jfMcQtV2vcKio5NQkbqskw6ZqznGw7w';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);