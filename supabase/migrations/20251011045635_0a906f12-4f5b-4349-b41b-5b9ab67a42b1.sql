-- Add smart tag support to items table
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS is_smart_tag BOOLEAN DEFAULT FALSE;

-- Add a 'registered' status for smart tags that aren't lost yet
-- (keeping existing status field which can be 'active', 'claimed', etc.)

-- Create a policy for public viewing of smart tag items by ID
CREATE POLICY "Anyone can view smart tag items by ID"
ON public.items
FOR SELECT
USING (is_smart_tag = true);

-- Create index for better performance on smart tag queries
CREATE INDEX IF NOT EXISTS idx_items_is_smart_tag ON public.items(is_smart_tag) WHERE is_smart_tag = true;