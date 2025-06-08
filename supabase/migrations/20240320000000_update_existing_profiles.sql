-- Update existing profiles with names from auth.users
UPDATE profiles p
SET 
    first_name = COALESCE(
        (raw_user_meta_data->>'first_name')::text,
        (raw_user_meta_data->>'full_name')::text,
        ''
    ),
    last_name = COALESCE(
        (raw_user_meta_data->>'last_name')::text,
        ''
    )
FROM auth.users u
WHERE p.id = u.id
AND (
    (raw_user_meta_data->>'first_name') IS NOT NULL 
    OR (raw_user_meta_data->>'full_name') IS NOT NULL
    OR (raw_user_meta_data->>'last_name') IS NOT NULL
); 