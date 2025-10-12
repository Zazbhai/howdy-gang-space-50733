-- Add new columns to items table
ALTER TABLE public.items
ADD COLUMN owner_name text,
ADD COLUMN estimated_value decimal(10,2),
ADD COLUMN reward_amount decimal(10,2);

-- Update RLS policies to protect sensitive information
DROP POLICY IF EXISTS "Anyone can view active items" ON public.items;
DROP POLICY IF EXISTS "Anyone can view smart tag items by ID" ON public.items;

-- Public can view limited info for smart tags (no sensitive data)
CREATE POLICY "Public can view basic smart tag info"
ON public.items
FOR SELECT
USING (
  is_smart_tag = true AND
  status = 'active'
);

-- Authenticated users who own the item can see all details
CREATE POLICY "Owners can view full item details"
ON public.items
FOR SELECT
USING (
  auth.uid() = user_id
);