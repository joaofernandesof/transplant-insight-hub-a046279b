-- Add IPROMED module permissions for the new profile
INSERT INTO neohub_module_permissions (profile, module_code, module_name, portal, can_read, can_write, can_delete)
VALUES 
  ('ipromed', 'ipromed_dashboard', 'Dashboard IPROMED', 'ipromed', true, true, false),
  ('ipromed', 'ipromed_clients', 'Clientes IPROMED', 'ipromed', true, true, true),
  ('ipromed', 'ipromed_legal', 'Legal Hub', 'ipromed', true, true, true),
  ('ipromed', 'ipromed_journey', 'Jornada do Cliente', 'ipromed', true, true, false),
  ('ipromed', 'ipromed_contracts', 'Contratos', 'ipromed', true, true, false),
  ('ipromed', 'ipromed_financial', 'Financeiro', 'ipromed', true, true, false),
  ('ipromed', 'ipromed_publications', 'Publicações', 'ipromed', true, true, false),
  ('ipromed', 'ipromed_alerts', 'Alertas', 'ipromed', true, true, false)
ON CONFLICT DO NOTHING;