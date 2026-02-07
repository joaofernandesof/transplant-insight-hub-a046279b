-- Phase 3: Drop legacy tables, triggers, and functions

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_update_conversa_on_message ON avivar_mensagens;
DROP TRIGGER IF EXISTS update_avivar_conversas_updated_at ON avivar_conversas;
DROP TRIGGER IF EXISTS update_avivar_mensagens_updated_at ON avivar_mensagens;
DROP TRIGGER IF EXISTS update_whatsapp_sessions_updated_at ON avivar_whatsapp_sessions;
DROP TRIGGER IF EXISTS update_whatsapp_contacts_updated_at ON avivar_whatsapp_contacts;
DROP TRIGGER IF EXISTS update_avivar_team_members_timestamp ON avivar_team_members;
DROP TRIGGER IF EXISTS update_followup_metrics_updated_at ON avivar_followup_metrics;

-- Drop functions
DROP FUNCTION IF EXISTS get_or_create_avivar_conversa(text, text, text, text);
DROP FUNCTION IF EXISTS mark_avivar_messages_as_read(uuid);
DROP FUNCTION IF EXISTS update_avivar_conversa_on_message();
DROP FUNCTION IF EXISTS update_avivar_team_members_updated_at();

-- Drop tables (CASCADE handles FK dependencies)
DROP TABLE IF EXISTS avivar_mensagens CASCADE;
DROP TABLE IF EXISTS avivar_conversas CASCADE;
DROP TABLE IF EXISTS avivar_whatsapp_messages CASCADE;
DROP TABLE IF EXISTS avivar_whatsapp_contacts CASCADE;
DROP TABLE IF EXISTS avivar_whatsapp_sessions CASCADE;
DROP TABLE IF EXISTS avivar_followup_metrics CASCADE;
DROP TABLE IF EXISTS avivar_team_members CASCADE;