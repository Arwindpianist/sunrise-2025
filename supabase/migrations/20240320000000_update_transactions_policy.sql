-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;

-- Create new policy with proper permissions
CREATE POLICY "Users can view their own transactions"
    ON transactions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id); 