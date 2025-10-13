-- Allow public to view ALL smart tag items (regardless of status)
DROP POLICY IF EXISTS "Public can view basic smart tag info" ON public.items;

CREATE POLICY "Public can view all smart tag items" 
ON public.items 
FOR SELECT 
USING (is_smart_tag = true);