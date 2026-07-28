-- Migration: Create premium_waitlist table for storing email registrations
-- This table stores email addresses of users interested in QueueLess Premium

CREATE TABLE IF NOT EXISTS public.premium_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Unique constraint on email to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS premium_waitlist_email_idx ON public.premium_waitlist (email);

-- RLS policies for public access (insert only, no updates/deletes from client)
ALTER TABLE public.premium_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can sign up for the waitlist
CREATE POLICY "Anyone can join the premium waitlist" 
  ON public.premium_waitlist 
  FOR INSERT 
  WITH CHECK (true);

-- Waitlist entries are publicly readable (for verification)
CREATE POLICY "Premium waitlist entries are publicly readable" 
  ON public.premium_waitlist 
  FOR SELECT 
  USING (true);
