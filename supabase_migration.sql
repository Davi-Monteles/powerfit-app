-- PowerFit deploy migration
-- Run this in Supabase SQL Editor before deploying the demo.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS "daysPerWeek" integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS shift text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS "medicalNotes" text,
  ADD COLUMN IF NOT EXISTS target_muscles jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS category text;

ALTER TABLE public.schedule
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.evolution
  ADD COLUMN IF NOT EXISTS waist numeric,
  ADD COLUMN IF NOT EXISTS hip numeric,
  ADD COLUMN IF NOT EXISTS thigh numeric;

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS image text,
  ADD COLUMN IF NOT EXISTS label text,
  ALTER COLUMN url DROP NOT NULL,
  ALTER COLUMN "type" DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.weekly_schedules (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  workout_id text,
  day_of_week text NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now()
);

ALTER TABLE public.weekly_schedules
  ADD COLUMN IF NOT EXISTS workout_id text,
  ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now();

ALTER TABLE public.weekly_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_full_access_weekly_schedules" ON public.weekly_schedules;
CREATE POLICY "anon_full_access_weekly_schedules"
  ON public.weekly_schedules FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
