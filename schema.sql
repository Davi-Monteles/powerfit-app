-- Esquema SQL para estruturar o Banco de Dados PowerFit no Supabase

-- 1. Table: users (Mestres e Personais)
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  type text NOT NULL, -- 'master' ou 'personal'
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL, -- (Para uso futuro, idealmente usar o auth nativo do Supabase)
  "studentLimit" integer,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- 2. Table: students
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "personalId" uuid REFERENCES public.users(id),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  "birthDate" date,
  gender text,
  height numeric,
  weight numeric,
  "isPremium" boolean DEFAULT false,
  password text NOT NULL,
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
  "createdAt" timestamp with time zone DEFAULT now()
);

-- 5. Table: photos (Evolução Visual)
CREATE TABLE public.photos (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "studentId" uuid REFERENCES public.students(id) ON DELETE CASCADE,
  date date NOT NULL,
  url text NOT NULL,
  "type" text NOT NULL, -- 'before' ou 'after'
  "createdAt" timestamp with time zone DEFAULT now()
);

-- 6. Table: schedule (Agendamento de Treinos/Aulas)
CREATE TABLE public.schedule (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  "personalId" uuid REFERENCES public.users(id),
  "studentId" uuid REFERENCES public.students(id),
  tittle text,
  date date NOT NULL,
  time text NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- Habilitar RLS e Políticas
-- Recomendado: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
-- e depois configurar as policies dependendo de como as rotas lidarem com auth.
