const { Client } = require('pg');

// Using the credentials found in the user's temp file
const projectId = 'owhltclwnobzfkflvtzv'; 
const password = 'kingvolkath9';

// Trying both common Supabase hosts
const hosts = [
  `db.${projectId}.supabase.co`,
  `aws-0-sa-east-1.pooler.supabase.com` // Common for Brazil
];

const sql = `
DO $$ 
BEGIN 
    -- Adicionando colunas à tabela students se não existirem
    BEGIN ALTER TABLE public.students ADD COLUMN address text; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.students ADD COLUMN objective text; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.students ADD COLUMN "medicalNotes" text; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.students ADD COLUMN "daysPerWeek" integer DEFAULT 3; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.students ADD COLUMN shift text; EXCEPTION WHEN duplicate_column THEN END;
    
    -- Garante que as tabelas base existam (caso tenham sido deletadas)
    CREATE TABLE IF NOT EXISTS public.users (
      id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      type text NOT NULL,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      password text NOT NULL,
      "studentLimit" integer,
      "createdAt" timestamp with time zone DEFAULT now()
    );
    
    CREATE TABLE IF NOT EXISTS public.workouts (
      id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      "personalId" uuid REFERENCES public.users(id),
      name text NOT NULL,
      description text,
      exercises jsonb DEFAULT '[]'::jsonb,
      "createdAt" timestamp with time zone DEFAULT now(),
      "updatedAt" timestamp with time zone DEFAULT now()
    );
END $$;

-- Atualiza o Aluno VIP
UPDATE public.students SET "isPremium" = true WHERE email = 'davimonteles62@gmail.com';
`;

async function tryConnect(host) {
  const client = new Client({
    host: host,
    port: 5432, 
    database: 'postgres',
    user: `postgres`,
    password: password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    console.log(`Tentando conectar ao host: ${host}...`);
    await client.connect();
    console.log('CONECTADO COM SUCESSO!');
    await client.query(sql);
    console.log('BANCO DE DADOS ATUALIZADO!');
    return true;
  } catch (err) {
    console.error(`Falha no host ${host}: ${err.message}`);
    return false;
  } finally {
    await client.end();
  }
}

async function run() {
  for (const host of hosts) {
    if (await tryConnect(host)) break;
  }
}

run();
