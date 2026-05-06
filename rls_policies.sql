-- =====================================================================
-- PowerFit — Script RLS (Row Level Security) Completo
-- =====================================================================
--
-- ⚠️  CONTEXTO IMPORTANTE:
--     O PowerFit NÃO utiliza o Supabase Auth nativo (auth.uid()).
--     A autenticação é custom: email/password nas tabelas users e students.
--     O cliente JS utiliza APENAS a anon key, sem sessão Supabase Auth.
--
--     Consequência: auth.uid() é SEMPRE NULL nas queries do app.
--
--     ESTRATÉGIA ESCOLHIDA (2 opções abaixo):
--     ► OPÇÃO A (RECOMENDADA): Desabilitar RLS e usar Service Role Key no backend
--     ► OPÇÃO B (PALIATIVA): Permitir acesso total via anon (RLS habilitado, mas aberto)
--
--     A Opção B é necessária enquanto o app não migrar para o Supabase Auth nativo.
--     Quando migrar, use a Opção C (RLS real com auth.uid()).
--
-- =====================================================================


-- =====================================================================
-- OPÇÃO A: DESABILITAR RLS (Se você usa APENAS o client-side com anon key)
-- Descomente este bloco se quiser simplesmente remover o bloqueio atual.
-- =====================================================================

-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.workouts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.evolution DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.photos DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.schedule DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.weekly_schedules DISABLE ROW LEVEL SECURITY;


-- =====================================================================
-- OPÇÃO B: RLS HABILITADO COM PERMISSÃO TOTAL PARA ANON
-- (Necessário enquanto o app não usa Supabase Auth)
-- Isso efetivamente mantém o RLS "ligado" mas permite tudo via anon key.
-- =====================================================================

-- 1. Garantir que RLS está habilitado em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;

-- weekly_schedules pode não existir ainda — proteger com DO block
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'weekly_schedules') THEN
    EXECUTE 'ALTER TABLE public.weekly_schedules ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;


-- 2. Limpar policies antigas (evita conflitos de nome)
DO $$
DECLARE
  tbl text;
  pol record;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['users','students','workouts','evolution','photos','schedule','weekly_schedules'])
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
      END LOOP;
    END IF;
  END LOOP;
END $$;


-- =====================================================================
-- 3. POLICIES: Acesso total via anon role (comportamento atual do app)
-- =====================================================================

-- ── users ──
CREATE POLICY "anon_full_access_users"
  ON public.users FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ── students ──
CREATE POLICY "anon_full_access_students"
  ON public.students FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ── workouts ──
CREATE POLICY "anon_full_access_workouts"
  ON public.workouts FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ── evolution ──
CREATE POLICY "anon_full_access_evolution"
  ON public.evolution FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ── photos ──
CREATE POLICY "anon_full_access_photos"
  ON public.photos FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ── schedule ──
CREATE POLICY "anon_full_access_schedule"
  ON public.schedule FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ── weekly_schedules (se existir) ──
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'weekly_schedules') THEN
    EXECUTE '
      CREATE POLICY "anon_full_access_weekly_schedules"
        ON public.weekly_schedules FOR ALL
        TO anon, authenticated
        USING (true)
        WITH CHECK (true)
    ';
  END IF;
END $$;


-- =====================================================================
-- OPÇÃO C: RLS REAL COM SUPABASE AUTH (FUTURO)
-- =====================================================================
-- USE ESTE BLOCO SOMENTE APÓS MIGRAR PARA SUPABASE AUTH NATIVO.
-- Para ativar: 
--   1. Apague todas as policies da Opção B acima
--   2. Descomente o bloco abaixo
--   3. Migre o login do app para supabase.auth.signInWithPassword()
--   4. O auth.uid() passará a retornar o UUID real do usuário logado
-- =====================================================================

/*
-- ── Helper: Verificar se o usuário autenticado é Personal/Master ──
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND type IN ('personal', 'master')
  );
$$;

-- ── Helper: Obter o student.id do usuário autenticado (se for aluno) ──
CREATE OR REPLACE FUNCTION public.get_student_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.students
  WHERE id = auth.uid()
  LIMIT 1;
$$;


-- ══════════════════════════════════════════════
-- TABLE: users
-- Personal/Master: ALL   |   Aluno: Só o próprio registro
-- ══════════════════════════════════════════════
CREATE POLICY "admin_full_access_users"
  ON public.users FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "student_read_own_users"
  ON public.users FOR SELECT
  TO authenticated
  USING (id = auth.uid());


-- ══════════════════════════════════════════════
-- TABLE: students
-- Personal/Master: ALL   |   Aluno: Próprio registro
-- ══════════════════════════════════════════════
CREATE POLICY "admin_full_access_students"
  ON public.students FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "student_read_own_students"
  ON public.students FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "student_update_own_students"
  ON public.students FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ══════════════════════════════════════════════
-- TABLE: workouts
-- Personal/Master: ALL   |   Aluno: Só leitura
-- ══════════════════════════════════════════════
CREATE POLICY "admin_full_access_workouts"
  ON public.workouts FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "student_read_workouts"
  ON public.workouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = auth.uid()
      AND (
        s."personalId" = workouts."personalId"
        OR workouts.id = ANY(
          SELECT jsonb_array_elements_text(s."workoutIds")::uuid
          FROM public.students
          WHERE id = auth.uid()
        )
      )
    )
  );


-- ══════════════════════════════════════════════
-- TABLE: evolution
-- Personal/Master: ALL   |   Aluno: Só os próprios registros
-- ══════════════════════════════════════════════
CREATE POLICY "admin_full_access_evolution"
  ON public.evolution FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "student_read_own_evolution"
  ON public.evolution FOR SELECT
  TO authenticated
  USING ("studentId" = auth.uid());


-- ══════════════════════════════════════════════
-- TABLE: photos
-- Personal/Master: ALL   |   Aluno: Só as próprias fotos
-- ══════════════════════════════════════════════
CREATE POLICY "admin_full_access_photos"
  ON public.photos FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "student_read_own_photos"
  ON public.photos FOR SELECT
  TO authenticated
  USING ("studentId" = auth.uid());


-- ══════════════════════════════════════════════
-- TABLE: schedule
-- Personal/Master: ALL   |   Aluno: Só agendamentos do próprio
-- ══════════════════════════════════════════════
CREATE POLICY "admin_full_access_schedule"
  ON public.schedule FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "student_read_own_schedule"
  ON public.schedule FOR SELECT
  TO authenticated
  USING ("studentId" = auth.uid());


-- ══════════════════════════════════════════════
-- TABLE: weekly_schedules
-- Personal/Master: ALL   |   Aluno: Próprios registros
-- ══════════════════════════════════════════════
CREATE POLICY "admin_full_access_weekly_schedules"
  ON public.weekly_schedules FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "student_full_own_weekly_schedules"
  ON public.weekly_schedules FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

*/


-- =====================================================================
-- VERIFICAÇÃO: Listar todas as policies ativas após execução
-- =====================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
