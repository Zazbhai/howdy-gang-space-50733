-- Add phone_number column to items table
ALTER TABLE public.items 
ADD COLUMN phone_number text;

-- Add a check to ensure phone numbers are properly formatted (basic validation)
ALTER TABLE public.items 
ADD CONSTRAINT phone_number_format 
CHECK (phone_number IS NULL OR length(phone_number) >= 10);