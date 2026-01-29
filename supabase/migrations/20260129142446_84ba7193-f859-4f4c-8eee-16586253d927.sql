-- Update password for mariaspereira.ic@gmail.com to Ibramec2026@
-- Using Supabase's auth.users admin function
UPDATE auth.users 
SET encrypted_password = crypt('Ibramec2026@', gen_salt('bf'))
WHERE email = 'mariaspereira.ic@gmail.com';