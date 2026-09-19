-- PowerFit production security migration
-- Run once in the Supabase SQL Editor before deploying this application version.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.users DROP COLUMN IF EXISTS password;
ALTER TABLE public.students DROP COLUMN IF EXISTS password;

ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.students(id) ON DELETE SET NULL;
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS created_by text;
CREATE TABLE IF NOT EXISTS public.weekly_schedules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  workout_id text,
  day_of_week text NOT NULL,
  "createdAt" timestamptz DEFAULT now()
);
ALTER TABLE public.weekly_schedules ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  objective text,
  source text NOT NULL DEFAULT 'perfil_publico',
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'contatado', 'arquivado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Link pre-existing profiles to existing Supabase Auth accounts by verified email.
UPDATE public.users AS profile
SET auth_user_id = account.id
FROM auth.users AS account
WHERE profile.auth_user_id IS NULL
  AND lower(profile.email) = lower(account.email);

WITH student_accounts AS (
  SELECT DISTINCT ON (lower(student.email)) student.id AS student_id, account.id AS auth_user_id
  FROM public.students AS student
  JOIN auth.users AS account ON lower(student.email) = lower(account.email)
  WHERE student.auth_user_id IS NULL
  ORDER BY lower(student.email), student."createdAt" DESC NULLS LAST
)
UPDATE public.students AS student
SET auth_user_id = link.auth_user_id
FROM student_accounts AS link
WHERE student.id = link.student_id;

CREATE OR REPLACE FUNCTION public.handle_powerfit_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  account_type text := CASE WHEN new.raw_user_meta_data->>'type' = 'personal' THEN 'personal' ELSE 'aluno' END;
  display_name text := COALESCE(NULLIF(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1));
  linked_student_id uuid;
BEGIN
  IF account_type = 'personal' THEN
    UPDATE public.users
    SET auth_user_id = new.id,
        name = COALESCE(NULLIF(display_name, ''), name)
    WHERE lower(email) = lower(new.email);

    IF NOT FOUND THEN
      INSERT INTO public.users (id, auth_user_id, type, name, email, "studentLimit", "createdAt")
      VALUES (new.id, new.id, 'personal', display_name, lower(new.email), 10, now());
    END IF;
  ELSE
    SELECT id INTO linked_student_id
    FROM public.students
    WHERE lower(email) = lower(new.email)
      AND auth_user_id IS NULL
    ORDER BY "createdAt" DESC NULLS LAST
    LIMIT 1;

    IF linked_student_id IS NULL THEN
      INSERT INTO public.students (id, auth_user_id, name, email, phone, "isPremium", "workoutIds", "workoutSchedule", "createdAt", "updatedAt")
      VALUES (new.id, new.id, display_name, lower(new.email), COALESCE(new.raw_user_meta_data->>'phone', ''), false, '[]'::jsonb, '[]'::jsonb, now(), now());
    ELSE
      UPDATE public.students
      SET auth_user_id = new.id,
          name = COALESCE(NULLIF(display_name, ''), name),
          phone = COALESCE(NULLIF(new.raw_user_meta_data->>'phone', ''), phone),
          "updatedAt" = now()
      WHERE id = linked_student_id;
    END IF;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_powerfit_auth_user_created ON auth.users;
CREATE TRIGGER on_powerfit_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_powerfit_auth_user();

CREATE OR REPLACE FUNCTION public.current_powerfit_personal_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$ SELECT id FROM public.users WHERE auth_user_id = auth.uid() AND type IN ('personal', 'master') LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.current_powerfit_student_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$ SELECT id FROM public.students WHERE auth_user_id = auth.uid() LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.is_powerfit_master()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$ SELECT EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND type = 'master') $$;

CREATE OR REPLACE FUNCTION public.powerfit_personal_owns_student(target_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE id = target_student_id
      AND "personalId" = public.current_powerfit_personal_id()
  )
$$;

CREATE OR REPLACE FUNCTION public.protect_powerfit_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_TABLE_NAME = 'users' THEN
    new.auth_user_id := old.auth_user_id;
    new.email := old.email;
    new.type := old.type;
  ELSIF TG_TABLE_NAME = 'students' AND old.auth_user_id = auth.uid() AND public.current_powerfit_personal_id() IS NULL THEN
    new.auth_user_id := old.auth_user_id;
    new.email := old.email;
    new."personalId" := old."personalId";
    new."isPremium" := old."isPremium";
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS protect_powerfit_users ON public.users;
CREATE TRIGGER protect_powerfit_users BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.protect_powerfit_profile_fields();
DROP TRIGGER IF EXISTS protect_powerfit_students ON public.students;
CREATE TRIGGER protect_powerfit_students BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.protect_powerfit_profile_fields();

DO $$
DECLARE
  table_name text;
  policy_row record;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['users','students','workouts','evolution','photos','schedule','weekly_schedules','leads']
  LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      FOR policy_row IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = table_name
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_row.policyname, table_name);
      END LOOP;
    END IF;
  END LOOP;
END $$;

CREATE POLICY users_select_own ON public.users FOR SELECT TO authenticated
USING (auth_user_id = auth.uid() OR public.is_powerfit_master());
CREATE POLICY users_update_own ON public.users FOR UPDATE TO authenticated
USING (auth_user_id = auth.uid() OR public.is_powerfit_master())
WITH CHECK (auth_user_id = auth.uid() OR public.is_powerfit_master());

CREATE POLICY students_select_scoped ON public.students FOR SELECT TO authenticated
USING (
  auth_user_id = auth.uid()
  OR "personalId" = public.current_powerfit_personal_id()
  OR public.is_powerfit_master()
);
CREATE POLICY students_insert_personal ON public.students FOR INSERT TO authenticated
WITH CHECK ("personalId" = public.current_powerfit_personal_id() OR public.is_powerfit_master());
CREATE POLICY students_update_scoped ON public.students FOR UPDATE TO authenticated
USING (
  auth_user_id = auth.uid()
  OR "personalId" = public.current_powerfit_personal_id()
  OR public.is_powerfit_master()
)
WITH CHECK (
  auth_user_id = auth.uid()
  OR "personalId" = public.current_powerfit_personal_id()
  OR public.is_powerfit_master()
);

CREATE POLICY workouts_select_scoped ON public.workouts FOR SELECT TO authenticated
USING (
  "personalId" = public.current_powerfit_personal_id()
  OR assigned_to::text = public.current_powerfit_student_id()::text
  OR public.is_powerfit_master()
);
CREATE POLICY workouts_insert_scoped ON public.workouts FOR INSERT TO authenticated
WITH CHECK (
  "personalId" = public.current_powerfit_personal_id()
  OR (assigned_to::text = public.current_powerfit_student_id()::text AND source = 'student_ai')
  OR public.is_powerfit_master()
);
CREATE POLICY workouts_update_scoped ON public.workouts FOR UPDATE TO authenticated
USING (
  "personalId" = public.current_powerfit_personal_id()
  OR (assigned_to::text = public.current_powerfit_student_id()::text AND source = 'student_ai')
  OR public.is_powerfit_master()
)
WITH CHECK (
  "personalId" = public.current_powerfit_personal_id()
  OR (assigned_to::text = public.current_powerfit_student_id()::text AND source = 'student_ai')
  OR public.is_powerfit_master()
);
CREATE POLICY workouts_delete_scoped ON public.workouts FOR DELETE TO authenticated
USING (
  "personalId" = public.current_powerfit_personal_id()
  OR (assigned_to::text = public.current_powerfit_student_id()::text AND source = 'student_ai')
  OR public.is_powerfit_master()
);

CREATE POLICY evolution_scoped ON public.evolution FOR ALL TO authenticated
USING (
  "studentId" = public.current_powerfit_student_id()
  OR public.powerfit_personal_owns_student("studentId")
  OR public.is_powerfit_master()
)
WITH CHECK (
  "studentId" = public.current_powerfit_student_id()
  OR public.powerfit_personal_owns_student("studentId")
  OR public.is_powerfit_master()
);

CREATE POLICY photos_scoped ON public.photos FOR ALL TO authenticated
USING (
  "studentId" = public.current_powerfit_student_id()
  OR public.powerfit_personal_owns_student("studentId")
  OR public.is_powerfit_master()
)
WITH CHECK (
  "studentId" = public.current_powerfit_student_id()
  OR public.powerfit_personal_owns_student("studentId")
  OR public.is_powerfit_master()
);

CREATE POLICY schedule_scoped ON public.schedule FOR ALL TO authenticated
USING (
  "personalId" = public.current_powerfit_personal_id()
  OR "studentId" = public.current_powerfit_student_id()
  OR public.is_powerfit_master()
)
WITH CHECK (
  "personalId" = public.current_powerfit_personal_id()
  OR "studentId" = public.current_powerfit_student_id()
  OR public.is_powerfit_master()
);

CREATE POLICY weekly_schedules_scoped ON public.weekly_schedules FOR ALL TO authenticated
USING (
  student_id = public.current_powerfit_student_id()
  OR public.powerfit_personal_owns_student(student_id)
  OR public.is_powerfit_master()
)
WITH CHECK (
  student_id = public.current_powerfit_student_id()
  OR public.powerfit_personal_owns_student(student_id)
  OR public.is_powerfit_master()
);

DO $$
BEGIN
  IF to_regclass('public.leads') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY leads_public_insert ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (char_length(trim(name)) BETWEEN 2 AND 100 AND char_length(coalesce(objective, '''')) <= 500 AND status = ''novo'')';
    EXECUTE 'CREATE POLICY leads_personal_select ON public.leads FOR SELECT TO authenticated USING (trainer_id = public.current_powerfit_personal_id() OR public.is_powerfit_master())';
    EXECUTE 'CREATE POLICY leads_personal_update ON public.leads FOR UPDATE TO authenticated USING (trainer_id = public.current_powerfit_personal_id() OR public.is_powerfit_master()) WITH CHECK (trainer_id = public.current_powerfit_personal_id() OR public.is_powerfit_master())';
    EXECUTE 'REVOKE ALL ON public.leads FROM anon';
    EXECUTE 'GRANT INSERT ON public.leads TO anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON public.leads TO authenticated';
  END IF;
END $$;

REVOKE ALL ON public.users, public.students, public.workouts, public.evolution, public.photos, public.schedule, public.weekly_schedules FROM anon;
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts, public.evolution, public.photos, public.schedule, public.weekly_schedules TO authenticated;

COMMIT;
