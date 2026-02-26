
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anyone can insert scores" ON public.scores;
DROP POLICY IF EXISTS "Anyone can update scores" ON public.scores;
DROP POLICY IF EXISTS "Anyone can view scores" ON public.scores;

CREATE POLICY "Anyone can insert scores"
ON public.scores FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update scores"
ON public.scores FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can view scores"
ON public.scores FOR SELECT
USING (true);
