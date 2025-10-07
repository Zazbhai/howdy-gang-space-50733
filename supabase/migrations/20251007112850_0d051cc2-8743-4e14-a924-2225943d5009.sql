-- Drop all existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Item owners can view claimant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Claimants can view item owner profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to view profiles of people who claimed their items
CREATE POLICY "Item owners can view claimant profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.claims
      JOIN public.items ON items.id = claims.item_id
      WHERE claims.claimant_id = profiles.id
        AND items.user_id = auth.uid()
    )
  );

-- Allow claimants to view profiles of item owners
CREATE POLICY "Claimants can view item owner profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.items
      JOIN public.claims ON claims.item_id = items.id
      WHERE items.user_id = profiles.id
        AND claims.claimant_id = auth.uid()
    )
  );

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));