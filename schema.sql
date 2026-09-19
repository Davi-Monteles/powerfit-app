-- Esquema SQL para estruturar o Banco de Dados PowerFit no Supabase

-- 1. Table: users (Mestres e Personais)
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  type text NOT NULL, -- 'master' ou 'personal'
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  "studentLimit" integer,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- 2. Table: students
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  "personalId" uuid REFERENCES public.users(id),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  "birthDate" date,
  gender text,
  height numeric,
  weight numeric,
  objective text,
  "daysPerWeek" integer DEFAULT 3,
  shift text,
  address text,
  "medicalNotes" text,
  target_muscles jsonb DEFAULT '[]'::jsonb,
  "isPremium" boolean DEFAULT false,
  "workoutIds" jsonb DEFAULT '[]'::jsonb,
  "workoutSchedule" jsonb DEFAULT '[]'::jsonb,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- 3. Table: workouts
CREATE TABLE public.workouts (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "personalId" uuid REFERENCES public.users(id),
  name text NOT NULL,
  category text,
  description text,
  exercises jsonb DEFAULT '[]'::jsonb,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- 4. Table: evolution (Histórico Corporal)
CREATE TABLE public.evolution (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "studentId" uuid REFERENCES public.students(id) ON DELETE CASCADE,
  date date NOT NULL,
  weight numeric,
  "bodyFat" numeric,
  arm numeric,
  legs numeric,
  chest numeric,
  waist numeric,
  hip numeric,
  thigh numeric,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- 5. Table: photos (Evolução Visual)
CREATE TABLE public.photos (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "studentId" uuid REFERENCES public.students(id) ON DELETE CASCADE,
  date date NOT NULL,
  image text,
  label text,
  url text,
  "type" text,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- 6. Table: schedule (Agendamento de Treinos/Aulas)
CREATE TABLE public.schedule (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "personalId" uuid REFERENCES public.users(id),
  "studentId" uuid REFERENCES public.students(id),
  title text,
  tittle text,
  date date NOT NULL,
  time text NOT NULL,
  type text,
  notes text,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- 7. Table: weekly_schedules (Agendamentos gerados pela IA)
CREATE TABLE public.weekly_schedules (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  workout_id text,
  day_of_week text NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- Habilitar RLS e Políticas
-- Recomendado: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
-- e depois configurar as policies dependendo de como as rotas lidarem com auth.
