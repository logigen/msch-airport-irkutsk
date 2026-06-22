const pool = require('./pool');

async function ensureMedicalHistory() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS patient_medical_histories (
      patient_id      INT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
      complaints      TEXT NOT NULL DEFAULT '',
      anamnesis       TEXT NOT NULL DEFAULT '',
      diagnosis       TEXT NOT NULL DEFAULT '',
      treatment       TEXT NOT NULL DEFAULT '',
      recommendations TEXT NOT NULL DEFAULT '',
      notes           TEXT NOT NULL DEFAULT '',
      updated_by      INT REFERENCES users (id) ON DELETE SET NULL,
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_patient_medical_histories_updated_at
    ON patient_medical_histories (updated_at)
  `);
}

module.exports = { ensureMedicalHistory };
