
-- Estender payments para cobranças nascidas no CRM/orçamento (sem appointment) e novos status
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'enviada';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'visualizada';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'vencida';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'cancelada';
