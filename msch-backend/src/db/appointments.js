const pool = require('./pool');

async function ensureAppointmentsSync() {
  await pool.query(`
    ALTER TABLE appointments
    DROP CONSTRAINT IF EXISTS appointments_slot_id_key
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_slot_busy
    ON appointments (slot_id)
    WHERE status IN ('active', 'completed')
  `);

  await pool.query(`
    CREATE OR REPLACE FUNCTION trg_slot_mark_busy()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    BEGIN
      UPDATE slots SET is_available = FALSE WHERE id = NEW.slot_id;
      RETURN NEW;
    END;
    $$;
  `);

  await pool.query(`
    CREATE OR REPLACE FUNCTION trg_slot_free_on_cancel()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    BEGIN
      IF NEW.status = 'cancelled' AND OLD.status = 'active' THEN
        UPDATE slots SET is_available = TRUE WHERE id = NEW.slot_id;
      END IF;
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'after_appointment_insert'
      ) THEN
        CREATE TRIGGER after_appointment_insert
        AFTER INSERT ON appointments
        FOR EACH ROW EXECUTE FUNCTION trg_slot_mark_busy();
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'after_appointment_status_change'
      ) THEN
        CREATE TRIGGER after_appointment_status_change
        BEFORE UPDATE ON appointments
        FOR EACH ROW EXECUTE FUNCTION trg_slot_free_on_cancel();
      END IF;
    END $$;
  `);

  await pool.query(`
    UPDATE slots s
    SET is_available = FALSE
    WHERE EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.slot_id = s.id AND a.status IN ('active', 'completed')
    )
  `);

  await pool.query(`
    UPDATE slots s
    SET is_available = TRUE
    WHERE NOT EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.slot_id = s.id AND a.status IN ('active', 'completed')
    )
  `);
}

module.exports = { ensureAppointmentsSync };
