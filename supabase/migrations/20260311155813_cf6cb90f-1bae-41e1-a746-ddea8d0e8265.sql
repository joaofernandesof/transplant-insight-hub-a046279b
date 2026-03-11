
-- Add avivar portal to user
UPDATE neohub_users 
SET allowed_portals = array_append(allowed_portals, 'avivar') 
WHERE email = 'mrobister@gmail.com' AND NOT ('avivar' = ANY(allowed_portals));

-- Create avivar account
INSERT INTO avivar_accounts (name, slug, owner_user_id, allowed_nichos, is_active, plan)
VALUES ('Robister Moreno', 'robister-moreno', '02d4b651-f5fd-4228-a97e-9489ee324493', ARRAY['saude'], true, 'basic');

-- Add as account member (owner)
INSERT INTO avivar_account_members (account_id, user_id, role, is_active)
SELECT id, '02d4b651-f5fd-4228-a97e-9489ee324493', 'owner', true
FROM avivar_accounts WHERE owner_user_id = '02d4b651-f5fd-4228-a97e-9489ee324493' AND slug = 'robister-moreno';

-- Add avivar profile
INSERT INTO neohub_user_profiles (neohub_user_id, profile, is_active)
VALUES ('4033066b-3c78-45f3-a954-705e13512941', 'cliente_avivar', true)
ON CONFLICT DO NOTHING;
