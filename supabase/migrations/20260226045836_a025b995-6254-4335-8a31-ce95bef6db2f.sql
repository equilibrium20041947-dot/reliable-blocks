
-- Delete duplicate rows, keeping only the best score per email
DELETE FROM public.scores
WHERE id NOT IN (
  SELECT DISTINCT ON (email) id
  FROM public.scores
  ORDER BY email, score DESC
);

-- Add unique constraint on email so only one row per user
ALTER TABLE public.scores ADD CONSTRAINT scores_email_unique UNIQUE (email);
