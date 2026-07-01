
DO $$
DECLARE
  _ids uuid[];
  _stmts text[] := ARRAY[
    'DELETE FROM public.package_purchases WHERE professional_id = ANY($1) OR patient_id = ANY($1)',
    'DELETE FROM public.appointment_events WHERE appointment_id IN (SELECT id FROM public.appointments WHERE professional_id = ANY($1) OR patient_id = ANY($1))',
    'DELETE FROM public.messages WHERE appointment_id IN (SELECT id FROM public.appointments WHERE professional_id = ANY($1) OR patient_id = ANY($1))',
    'DELETE FROM public.charge_events WHERE payment_id IN (SELECT id FROM public.payments WHERE patient_id = ANY($1) OR recipient_id = ANY($1))',
    'DELETE FROM public.payments WHERE patient_id = ANY($1) OR recipient_id = ANY($1) OR appointment_id IN (SELECT id FROM public.appointments WHERE professional_id = ANY($1) OR patient_id = ANY($1))',
    'DELETE FROM public.reviews WHERE professional_id = ANY($1) OR patient_id = ANY($1)',
    'DELETE FROM public.quote_items WHERE quote_id IN (SELECT id FROM public.quotes WHERE professional_id = ANY($1) OR patient_id = ANY($1) OR assigned_user_id = ANY($1))',
    'DELETE FROM public.quotes WHERE professional_id = ANY($1) OR patient_id = ANY($1) OR assigned_user_id = ANY($1)',
    'DELETE FROM public.appointments WHERE professional_id = ANY($1) OR patient_id = ANY($1)',
    'DELETE FROM public.crm_patient_relationships WHERE professional_id = ANY($1) OR patient_id = ANY($1)',
    'DELETE FROM public.crm_patient_notes WHERE professional_id = ANY($1) OR patient_id = ANY($1)',
    'DELETE FROM public.crm_contacts WHERE professional_id = ANY($1) OR claimed_user_id = ANY($1)',
    'DELETE FROM public.wallet_transactions WHERE provider_id = ANY($1)',
    'DELETE FROM public.payout_items WHERE batch_id IN (SELECT id FROM public.payout_batches WHERE provider_id = ANY($1))',
    'DELETE FROM public.payout_batches WHERE provider_id = ANY($1)',
    'DELETE FROM public.payouts WHERE provider_id = ANY($1)',
    'DELETE FROM public.notifications WHERE user_id = ANY($1)',
    'DELETE FROM public.notification_preferences WHERE user_id = ANY($1)',
    'DELETE FROM public.favorites WHERE profile_id = ANY($1)',
    'DELETE FROM public.favorites WHERE user_id = ANY($1)',
    'DELETE FROM public.featured_regions WHERE subscription_id IN (SELECT id FROM public.featured_subscriptions WHERE professional_id = ANY($1) OR company_id IN (SELECT id FROM public.companies WHERE owner_id = ANY($1)))',
    'DELETE FROM public.featured_categories WHERE subscription_id IN (SELECT id FROM public.featured_subscriptions WHERE professional_id = ANY($1) OR company_id IN (SELECT id FROM public.companies WHERE owner_id = ANY($1)))',
    'DELETE FROM public.featured_subscriptions WHERE professional_id = ANY($1) OR company_id IN (SELECT id FROM public.companies WHERE owner_id = ANY($1))',
    'DELETE FROM public.professional_availability WHERE professional_id = ANY($1)',
    'DELETE FROM public.professional_business_hours WHERE professional_id = ANY($1)',
    'DELETE FROM public.professional_blocked_slots WHERE professional_id = ANY($1)',
    'DELETE FROM public.professional_documents WHERE professional_id = ANY($1)',
    'DELETE FROM public.profiles_premium_assets WHERE profile_id = ANY($1)',
    'DELETE FROM public.services WHERE professional_id = ANY($1) OR company_id IN (SELECT id FROM public.companies WHERE owner_id = ANY($1))',
    'DELETE FROM public.service_packages WHERE professional_id = ANY($1) OR company_id IN (SELECT id FROM public.companies WHERE owner_id = ANY($1))',
    'DELETE FROM public.unit_professionals WHERE professional_id = ANY($1) OR unit_id IN (SELECT id FROM public.company_units WHERE company_id IN (SELECT id FROM public.companies WHERE owner_id = ANY($1)))',
    'DELETE FROM public.company_units WHERE company_id IN (SELECT id FROM public.companies WHERE owner_id = ANY($1))',
    'DELETE FROM public.company_members WHERE user_id = ANY($1) OR company_id IN (SELECT id FROM public.companies WHERE owner_id = ANY($1))',
    'DELETE FROM public.companies WHERE owner_id = ANY($1)',
    'DELETE FROM public.professionals WHERE id = ANY($1)',
    'DELETE FROM public.user_roles WHERE user_id = ANY($1)',
    'DELETE FROM public.profiles WHERE id = ANY($1)',
    'DELETE FROM auth.users WHERE id = ANY($1)'
  ];
  _s text;
BEGIN
  SELECT ARRAY(SELECT id FROM auth.users WHERE lower(email) LIKE '%@livvo.demo') INTO _ids;
  IF array_length(_ids, 1) IS NULL THEN RETURN; END IF;

  FOREACH _s IN ARRAY _stmts LOOP
    BEGIN
      EXECUTE _s USING _ids;
    EXCEPTION WHEN undefined_column OR undefined_table THEN
      -- skip: schema doesn't have this column/table
      NULL;
    END;
  END LOOP;
END $$;
