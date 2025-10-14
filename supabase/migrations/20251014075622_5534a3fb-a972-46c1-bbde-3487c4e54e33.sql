-- Allow everyone to view active lost/found items for search functionality
CREATE POLICY "Public can view active items"
ON public.items
FOR SELECT
USING (status = 'active' AND is_smart_tag = false);