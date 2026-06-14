-- Onda 1 CRM: novos valores de enum (precisam ser commitados antes de uso em funções)
ALTER TYPE public.crm_status ADD VALUE IF NOT EXISTS 'contato_realizado' AFTER 'novo_lead';
ALTER TYPE public.crm_status ADD VALUE IF NOT EXISTS 'orcamento_enviado' AFTER 'contato_realizado';
ALTER TYPE public.crm_status ADD VALUE IF NOT EXISTS 'aguardando_decisao' AFTER 'orcamento_enviado';
ALTER TYPE public.crm_status ADD VALUE IF NOT EXISTS 'fidelizado' AFTER 'atendido';

ALTER TYPE public.company_role ADD VALUE IF NOT EXISTS 'recepcionista' AFTER 'admin';

ALTER TYPE public.notification_event ADD VALUE IF NOT EXISTS 'lead_created';
ALTER TYPE public.notification_event ADD VALUE IF NOT EXISTS 'quote_sent';
ALTER TYPE public.notification_event ADD VALUE IF NOT EXISTS 'quote_viewed';
ALTER TYPE public.notification_event ADD VALUE IF NOT EXISTS 'quote_approved';
ALTER TYPE public.notification_event ADD VALUE IF NOT EXISTS 'quote_rejected';

-- Novos enums (criados do zero, sem restrição transacional)
DO $$ BEGIN
  CREATE TYPE public.patient_origin AS ENUM (
    'busca_organica','anuncio_patrocinado','indicacao','cadastro_direto',
    'importado','perfil_publico','campanha','outros'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.quote_status AS ENUM (
    'rascunho','enviado','visualizado','aprovado','recusado','expirado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
