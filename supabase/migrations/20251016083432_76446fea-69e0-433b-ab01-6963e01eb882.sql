-- Allow item owners to update claims for their items
CREATE POLICY "Item owners can update claims for their items"
ON public.claims
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM public.items 
    WHERE items.id = claims.item_id 
    AND items.user_id = auth.uid()
  )
);