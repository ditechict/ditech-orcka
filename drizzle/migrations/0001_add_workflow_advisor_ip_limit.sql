CREATE OR REPLACE FUNCTION public.consume_workflow_advisor_rate_limit(p_identifier text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count integer;
BEGIN
  IF p_identifier IS NULL OR length(p_identifier) < 1 OR length(p_identifier) > 128 THEN
    RETURN false;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('workflow-advisor:' || p_identifier, 0));

  DELETE FROM public.rate_limits
  WHERE identifier = p_identifier
    AND endpoint = 'workflow-advisor'
    AND created_at < now() - interval '1 minute';

  SELECT count(*) INTO request_count
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND endpoint = 'workflow-advisor'
    AND created_at >= now() - interval '1 minute';

  IF request_count >= 5 THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limits (identifier, endpoint)
  VALUES (p_identifier, 'workflow-advisor');

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_workflow_advisor_rate_limit(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_workflow_advisor_rate_limit(text) TO service_role;