-- Migration: Create premium_waitlist table for storing email registrations
-- This table stores email addresses of users interested in QueueLess Premium

CREATE TABLE IF NOT EXISTS public.premium_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  CONSTRAINT premium_waitlist_email_format CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

-- Unique constraint on email to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS premium_waitlist_email_idx ON public.premium_waitlist (email);

-- RLS policies
ALTER TABLE public.premium_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can join the waitlist (RLS enforced by server-side email normalization + constraint)
CREATE POLICY "Anyone can join the premium waitlist" 
  ON public.premium_waitlist 
  FOR INSERT 
  WITH CHECK (true);

-- No SELECT policy: entries are not publicly readable
