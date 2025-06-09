-- Enable RLS on user_balances table
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own balance" ON user_balances;
DROP POLICY IF EXISTS "Users can update their own balance" ON user_balances;
DROP POLICY IF EXISTS "Users can insert their own balance" ON user_balances;

-- Create policy for viewing own balance
CREATE POLICY "Users can view their own balance"
ON user_balances
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for updating own balance
CREATE POLICY "Users can update their own balance"
ON user_balances
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy for inserting own balance
CREATE POLICY "Users can insert their own balance"
ON user_balances
FOR INSERT
WITH CHECK (auth.uid() = user_id); 