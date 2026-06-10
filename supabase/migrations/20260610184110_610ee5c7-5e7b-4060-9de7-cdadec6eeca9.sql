
REVOKE ALL ON FUNCTION public.is_company_owner(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wallet_balance(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_owner(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.wallet_balance(uuid) TO service_role;
