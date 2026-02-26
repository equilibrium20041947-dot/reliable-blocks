
CREATE POLICY "Anyone can update scores"
ON public.scores
FOR UPDATE
USING (true)
WITH CHECK (true);
