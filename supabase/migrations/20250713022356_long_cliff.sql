/*
  # Fix RLS Policies for Anonymous Access

  1. Security Changes
    - Update RLS policies to allow anonymous users to insert/update/delete expenses
    - Update RLS policies to allow anonymous users to insert/update/delete shopping items
    - This matches the current app's profile-based authentication system
  
  2. Tables Affected
    - `expenses` table: Allow anonymous CRUD operations
    - `shopping_items` table: Allow anonymous CRUD operations
  
  Note: This configuration is suitable for a trusted roommate environment.
  For production apps with external users, implement proper Supabase authentication.
*/

-- Drop existing restrictive policies for expenses table
DROP POLICY IF EXISTS "expenses_insert_policy" ON expenses;
DROP POLICY IF EXISTS "expenses_select_policy" ON expenses;
DROP POLICY IF EXISTS "expenses_update_policy" ON expenses;
DROP POLICY IF EXISTS "expenses_delete_policy" ON expenses;

-- Create new policies that allow anonymous access for expenses
CREATE POLICY "Allow anonymous insert expenses"
  ON expenses
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select expenses"
  ON expenses
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous update expenses"
  ON expenses
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete expenses"
  ON expenses
  FOR DELETE
  TO anon
  USING (true);

-- Also allow authenticated users (for future compatibility)
CREATE POLICY "Allow authenticated insert expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated select expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (true);

-- Drop existing restrictive policies for shopping_items table
DROP POLICY IF EXISTS "shopping_items_insert_policy" ON shopping_items;
DROP POLICY IF EXISTS "shopping_items_select_policy" ON shopping_items;
DROP POLICY IF EXISTS "shopping_items_update_policy" ON shopping_items;
DROP POLICY IF EXISTS "shopping_items_delete_policy" ON shopping_items;

-- Create new policies that allow anonymous access for shopping_items
CREATE POLICY "Allow anonymous insert shopping_items"
  ON shopping_items
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select shopping_items"
  ON shopping_items
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous update shopping_items"
  ON shopping_items
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete shopping_items"
  ON shopping_items
  FOR DELETE
  TO anon
  USING (true);

-- Also allow authenticated users (for future compatibility)
CREATE POLICY "Allow authenticated insert shopping_items"
  ON shopping_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated select shopping_items"
  ON shopping_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update shopping_items"
  ON shopping_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete shopping_items"
  ON shopping_items
  FOR DELETE
  TO authenticated
  USING (true);