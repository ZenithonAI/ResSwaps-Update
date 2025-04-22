/*
  # Add trigger for reservations table to update bidding status automatically

  1. New Function
    - Create a function to automatically handle bid expiration
    - Set up trigger to update reservation status when bid ends
*/

-- Create function to update status when bid ends
CREATE OR REPLACE FUNCTION handle_bid_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- If bid has ended and status is still available, update it
  IF NEW.bid_end_time < NOW() AND NEW.status = 'available' AND NEW.allow_bidding = true THEN
    -- If there's a current bid, mark as pending
    IF NEW.current_bid IS NOT NULL THEN
      NEW.status := 'pending';
    -- Otherwise mark as expired if no bids
    ELSE
      NEW.status := 'expired';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if the trigger exists before creating it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'reservations_bid_expiration'
  ) THEN
    CREATE TRIGGER reservations_bid_expiration
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION handle_bid_expiration();
  END IF;
END $$;