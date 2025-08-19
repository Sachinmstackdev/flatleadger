/*
  # Enhanced Expenses Table for Flexible Bill Splitting

  1. New Columns
    - `split_type` (text) - Type of split: 'equal', 'custom', 'full_payment'
    - `custom_splits` (jsonb) - Custom split amounts per user
    - `is_loan` (boolean) - Whether this is a loan/advance payment
    - `loan_to` (text[]) - Array of user IDs who received the loan
    - `notes` (text) - Additional notes about the expense

  2. Updates
    - Add new columns to existing expenses table
    - Set default values for existing records
    - Update RLS policies if needed
*/

-- Add new columns to expenses table
DO $$
BEGIN
  -- Add split_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'split_type'
  ) THEN
    ALTER TABLE expenses ADD COLUMN split_type text DEFAULT 'equal';
  END IF;

  -- Add custom_splits column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'custom_splits'
  ) THEN
    ALTER TABLE expenses ADD COLUMN custom_splits jsonb;
  END IF;

  -- Add is_loan column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'is_loan'
  ) THEN
    ALTER TABLE expenses ADD COLUMN is_loan boolean DEFAULT false;
  END IF;

  -- Add loan_to column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'loan_to'
  ) THEN
    ALTER TABLE expenses ADD COLUMN loan_to text[];
  END IF;

  -- Add notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'notes'
  ) THEN
    ALTER TABLE expenses ADD COLUMN notes text;
  END IF;
END $$;