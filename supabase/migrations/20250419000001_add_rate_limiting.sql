/*
  # Add rate limiting for bids

  1. Tables
    - Create rate_limits table to track bid attempts
    - Add functions to check and enforce rate limits
  2. Security
    - Add RLS policies for rate_limits table
*/

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action 
ON rate_limits(user_id, action_type, expires_at);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own rate limits"
ON rate_limits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action_type TEXT,
  p_max_attempts INTEGER,
  p_window_seconds INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  -- Clean up expired entries
  DELETE FROM rate_limits
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND expires_at < now();

  -- Count recent attempts
  SELECT COUNT(*)
  INTO attempt_count
  FROM rate_limits
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND expires_at > now();

  -- Check if under limit
  RETURN attempt_count < p_max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record rate limit attempt
CREATE OR REPLACE FUNCTION record_rate_limit_attempt(
  p_user_id UUID,
  p_action_type TEXT,
  p_window_seconds INTEGER
) RETURNS void AS $$
BEGIN
  INSERT INTO rate_limits (user_id, action_type, expires_at)
  VALUES (p_user_id, p_action_type, now() + (p_window_seconds || ' seconds')::interval);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enforce bid rate limiting
CREATE OR REPLACE FUNCTION enforce_bid_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  max_bids_per_window INTEGER := 5;  -- Maximum bids per window
  window_seconds INTEGER := 300;      -- Window size in seconds (5 minutes)
BEGIN
  -- Check if user is within rate limit
  IF NOT check_rate_limit(NEW.user_id, 'place_bid', max_bids_per_window, window_seconds) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before placing another bid.'
      USING ERRCODE = 'RATELIMIT';
  END IF;

  -- Record the attempt
  PERFORM record_rate_limit_attempt(NEW.user_id, 'place_bid', window_seconds);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for bid rate limiting
DROP TRIGGER IF EXISTS enforce_bid_rate_limit_trigger ON bids;
CREATE TRIGGER enforce_bid_rate_limit_trigger
  BEFORE INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION enforce_bid_rate_limit(); 