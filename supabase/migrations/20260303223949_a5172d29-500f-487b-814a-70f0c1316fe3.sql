
-- Add super_administrador profile for adm@neofolic.com.br
UPDATE neohub_user_profiles 
SET profile = 'super_administrador' 
WHERE neohub_user_id = '8d4b2850-cbba-4c17-a0df-ada596846b87' 
  AND profile = 'administrador' 
  AND is_active = true;

-- Add user_portal_roles entry for admin portal with super_administrador role
INSERT INTO user_portal_roles (user_id, portal_id, role_id, is_active)
VALUES (
  '8d4b2850-cbba-4c17-a0df-ada596846b87',
  '9b7aab58-220c-4e5f-9f0c-3bea3ee44064',
  '9b37fb6b-2e1b-4b12-831c-1cf4e4f4d9af',
  true
)
ON CONFLICT DO NOTHING;
