const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const HISTORY_FIELDS = ['complaints', 'anamnesis', 'diagnosis', 'treatment', 'recommendations', 'notes'];

const emptyHistory = (patientId) => ({
  patient_id: Number(patientId),
  complaints: '',
  anamnesis: '',
  diagnosis: '',
  treatment: '',
  recommendations: '',
  notes: '',
  updated_by: null,
  updated_by_name: null,
  updated_at: null,
});

async function ensurePatient(patientId) {
  const id = Number(patientId);
  if (!Number.isInteger(id) || id <= 0) return null;

  const { rows } = await pool.query(
    `SELECT id, full_name, email FROM users WHERE id=$1 AND role='patient'`,
    [id]
  );
  return rows[0] || null;
}

// GET /api/medical-history/:patientId  (doctor only)
router.get('/:patientId', auth(['doctor']), async (req, res) => {
  const { patientId } = req.params;
  const patient = await ensurePatient(patientId);
  if (!patient) return res.status(404).json({ message: 'Пациент не найден' });

  const { rows } = await pool.query(
    `SELECT
       h.patient_id,
       h.complaints,
       h.anamnesis,
       h.diagnosis,
       h.treatment,
       h.recommendations,
       h.notes,
       h.updated_by,
       u.full_name AS updated_by_name,
       h.updated_at
     FROM patient_medical_histories h
     LEFT JOIN users u ON u.id = h.updated_by
     WHERE h.patient_id=$1`,
    [patientId]
  );

  res.json({ patient, history: rows[0] || emptyHistory(patientId) });
});

// PUT /api/medical-history/:patientId  (doctor only)
router.put('/:patientId', auth(['doctor']), async (req, res) => {
  const { patientId } = req.params;
  const patient = await ensurePatient(patientId);
  if (!patient) return res.status(404).json({ message: 'Пациент не найден' });

  const values = HISTORY_FIELDS.map((field) => String(req.body[field] || '').trim());
  if (values.some((value) => value.length > 5000)) {
    return res.status(400).json({ message: 'Раздел истории болезни не должен превышать 5000 символов' });
  }

  const { rows } = await pool.query(
    `INSERT INTO patient_medical_histories (
       patient_id,
       complaints,
       anamnesis,
       diagnosis,
       treatment,
       recommendations,
       notes,
       updated_by
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (patient_id) DO UPDATE SET
       complaints=EXCLUDED.complaints,
       anamnesis=EXCLUDED.anamnesis,
       diagnosis=EXCLUDED.diagnosis,
       treatment=EXCLUDED.treatment,
       recommendations=EXCLUDED.recommendations,
       notes=EXCLUDED.notes,
       updated_by=EXCLUDED.updated_by,
       updated_at=NOW()
     RETURNING *`,
    [patientId, ...values, req.user.id]
  );

  res.json({ patient, history: rows[0] });
});

module.exports = router;
