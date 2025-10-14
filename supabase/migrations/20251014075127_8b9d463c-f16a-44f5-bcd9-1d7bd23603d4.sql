-- Allow public to view profiles of smart tag item owners
CREATE POLICY "Public can view smart tag owner profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.items
    WHERE items.user_id = profiles.id
      AND items.is_smart_tag = true
  )
);