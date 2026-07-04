/*
# Add payment_method column to payments

Adds a nullable `payment_method` column (text) to the `payments` table
to store how the student paid: 'cash' (tiền mặt) or 'transfer' (chuyển khoản).

Existing rows will have NULL which the UI will display as blank.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_method text;
  END IF;
END $$;
