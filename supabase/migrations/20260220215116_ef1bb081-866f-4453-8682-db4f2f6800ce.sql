
-- Fix CPG users: remove admin role, set all to 'licensee'
UPDATE user_roles SET role = 'licensee'
WHERE user_id IN (
  SELECT user_id FROM neohub_users 
  WHERE email IN ('caroline.parahyba@cpgadvocacia.com.br', 'larissa.guerreiro@cpgadvocacia.com.br')
) AND role = 'admin';
