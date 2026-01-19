-- ====================================
-- MIGRAÇÃO PARTE 1: Adicionar novos valores ao enum
-- ====================================
ALTER TYPE neohub_profile ADD VALUE IF NOT EXISTS 'administrador';
ALTER TYPE neohub_profile ADD VALUE IF NOT EXISTS 'cliente_avivar';