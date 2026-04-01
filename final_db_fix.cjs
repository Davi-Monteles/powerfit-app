const { Client } = require('pg');

const projectId = 'owhltclwnobzfkflvtzv'; 
const password = 'kingvolkath9';

const client = new Client({
  host: `db.${projectId}.supabase.co`,
  port: 5432, 
  database: 'postgres',
  user: `postgres`,
  password: password,
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- 1. Garante que as tabelas base existam
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  "studentLimit" integer,
  "createdAt" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- 2. Adiciona APENAS as colunas novas que o App precisa (Seguro)
DO $$ 
BEGIN 
    BEGIN ALTER TABLE public.students ADD COLUMN address text; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.students ADD COLUMN objective text; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.students ADD COLUMN "medicalNotes" text; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.students ADD COLUMN "daysPerWeek" integer DEFAULT 3; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.students ADD COLUMN shift text; EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- 3. Libera o acesso VIP para o seu aluno de teste
UPDATE public.students SET "isPremium" = true WHERE email = 'davimonteles62@gmail.com';

-- 4. Cria a tabela de treinos se não existir
CREATE TABLE IF NOT EXISTS public.workouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "personalId" uuid REFERENCES public.users(id),
  name text NOT NULL,
  description text,
  exercises jsonb DEFAULT '[]'::jsonb,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);
`;

async function run() {
  try {
    await client.connect();
    console.log('CONECTADO AO SUPABASE!');
    await client.query(sql);
    console.log('BANCO DE DADOS ATUALIZADO COM SUCESSO!');
  } catch (err) {
    console.error('ERRO AO ATUALIZAR:', err.message);
  } finally {
    await client.end();
  }
}

run();
