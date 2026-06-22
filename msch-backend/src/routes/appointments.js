const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

const CLINIC_TZ = 'Asia/Irkutsk';
const CLINIC_OFFSET = '+08:00';
const BOOKING_DAYS_AHEAD = 7;
const CLINIC_START = '08:00';
const WEEKDAY_END = '16:00';
const SATURDAY_END = '14:00';

const normalizeTime = (value) => String(value || '').slice(0, 5);
const maxTime = (a, b) => (a > b ? a : b);
const minTime = (a, b) => (a < b ? a : b);
const bookingWindowEnd = () => new Date(Date.now() + BOOKING_DAYS_AHEAD * 24 * 60 * 60000);

const clinicParts = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
};

const clinicHoursForDate = (dateKey) => {
  const weekday = new Date(`${dateKey}T12:00:00${CLINIC_OFFSET}`).getUTCDay();
  if (weekday === 0) return null;
  return {
    start: CLINIC_START,
    end: weekday === 6 ? SATURDAY_END : WEEKDAY_END,
  };
};

const validateBookableSlot = async (client, slot) => {
  const start = new Date(slot.started_at);
  const end = new Date(slot.ended_at);
  if (!slot.is_available || start <= new Date() || start > bookingWindowEnd()) {
    return 'Слот недоступен или уже занят';
  }

  const { rows } = await client.query(
    `SELECT to_char(work_start, 'HH24:MI') AS work_start,
            to_char(work_end, 'HH24:MI') AS work_end
     FROM doctors WHERE id=$1`,
    [slot.doctor_id]
  );
  if (!rows.length) return 'Врач не найден';

  const startParts = clinicParts(start);
  const endParts = clinicParts(end);
  const clinicHours = clinicHoursForDate(startParts.dateKey);
  if (!clinicHours || startParts.dateKey !== endParts.dateKey) {
    return 'Слот недоступен или уже занят';
  }

  const availableStart = maxTime(normalizeTime(rows[0].work_start || CLINIC_START), clinicHours.start);
  const availableEnd = minTime(normalizeTime(rows[0].work_end || WEEKDAY_END), clinicHours.end);
  if (availableEnd <= availableStart || startParts.time < availableStart || endParts.time > availableEnd) {
    return 'Слот недоступен или уже занят';
  }

  return '';
};

const APPT_SELECT = `
  SELECT
    a.id,
    a.status,
    a.created_at,
    json_build_object('id', p.id, 'full_name', p.full_name) AS patient,
    json_build_object(
      'id',         sl.id,
      'started_at', sl.started_at,
      'ended_at',   sl.ended_at,
      'is_available', sl.is_available,
      'doctor', json_build_object(
        'id',         d.id,
        'experience', d.experience,
        'user',       json_build_object('id', du.id, 'full_name', du.full_name),
        'specialization', json_build_object('id', sp.id, 'name', sp.name)
      )
    ) AS slot
  FROM appointments a
  JOIN users  p  ON p.id  = a.patient_id
  JOIN slots  sl ON sl.id = a.slot_id
  JOIN doctors d ON d.id  = sl.doctor_id
  JOIN users  du ON du.id = d.user_id
  JOIN specializations sp ON sp.id = d.specialization_id
`;

const APPT_ADMIN_SELECT = APPT_SELECT.replace(
  `json_build_object('id', p.id, 'full_name', p.full_name) AS patient`,
  `json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email) AS patient`
);

// GET /api/appointments  (admin – all)
router.get('/', auth(['admin']), async (req, res) => {
  const { rows } = await pool.query(`${APPT_ADMIN_SELECT} ORDER BY sl.started_at DESC`);
  res.json(rows);
});

// GET /api/appointments/my  (patient – own)
router.get('/my', auth(['patient']), async (req, res) => {
  const { rows } = await pool.query(
    `${APPT_SELECT} WHERE a.patient_id=$1 ORDER BY sl.started_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

// GET /api/appointments/doctor  (doctor – own patients)
router.get('/doctor', auth(['doctor']), async (req, res) => {
  const doc = await pool.query('SELECT id FROM doctors WHERE user_id=$1', [req.user.id]);
  if (!doc.rows.length) return res.status(403).json({ message: 'Профиль врача не найден' });

  const { rows } = await pool.query(
    `${APPT_SELECT} WHERE sl.doctor_id=$1 ORDER BY sl.started_at`,
    [doc.rows[0].id]
  );
  res.json(rows);
});

// POST /api/appointments  (patient books a slot)
router.post('/', auth(['patient']), async (req, res) => {
  const { slot_id } = req.body;
  if (!slot_id) return res.status(400).json({ message: 'Укажите slot_id' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const slot = await client.query(
      'SELECT * FROM slots WHERE id=$1 FOR UPDATE',
      [slot_id]
    );
    if (!slot.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Слот недоступен или уже занят' });
    }
    const slotError = await validateBookableSlot(client, slot.rows[0]);
    if (slotError) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: slotError });
    }

    const conflict = await client.query(
      `SELECT a.id FROM appointments a
       JOIN slots s2 ON s2.id=a.slot_id
       WHERE a.patient_id=$1 AND a.status='active'
         AND s2.started_at = $2`,
      [req.user.id, slot.rows[0].started_at]
    );
    if (conflict.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'У вас уже есть запись на это время' });
    }

    const { rows } = await client.query(
      `INSERT INTO appointments (patient_id, slot_id) VALUES ($1,$2) RETURNING id,status,created_at`,
      [req.user.id, slot_id]
    );
    await client.query('UPDATE slots SET is_available=FALSE WHERE id=$1', [slot_id]);
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23505') {
      return res.status(409).json({ message: 'Слот уже занят' });
    }
    console.error('Failed to create appointment', e);
    res.status(500).json({ message: 'Не удалось создать запись' });
  } finally {
    client.release();
  }
});

// POST /api/appointments/doctor  (doctor creates an appointment for a patient)
router.post('/doctor', auth(['doctor']), async (req, res) => {
  const { patient_id, slot_id } = req.body;
  if (!patient_id || !slot_id) {
    return res.status(400).json({ message: 'Укажите patient_id и slot_id' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const doc = await client.query('SELECT id FROM doctors WHERE user_id=$1', [req.user.id]);
    if (!doc.rows.length) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Профиль врача не найден' });
    }

    const patient = await client.query(
      `SELECT id FROM users WHERE id=$1 AND role='patient'`,
      [patient_id]
    );
    if (!patient.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Пациент не найден' });
    }

    const slot = await client.query(
      `SELECT * FROM slots WHERE id=$1 AND doctor_id=$2 FOR UPDATE`,
      [slot_id, doc.rows[0].id]
    );
    if (!slot.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Слот недоступен или уже занят' });
    }
    const slotError = await validateBookableSlot(client, slot.rows[0]);
    if (slotError) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: slotError });
    }

    const conflict = await client.query(
      `SELECT a.id FROM appointments a
       JOIN slots s2 ON s2.id=a.slot_id
       WHERE a.patient_id=$1 AND a.status='active'
         AND s2.started_at = $2`,
      [patient_id, slot.rows[0].started_at]
    );
    if (conflict.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'У пациента уже есть запись на это время' });
    }

    const { rows } = await client.query(
      `INSERT INTO appointments (patient_id, slot_id)
       VALUES ($1,$2)
       RETURNING id,status,created_at`,
      [patient_id, slot_id]
    );
    await client.query('UPDATE slots SET is_available=FALSE WHERE id=$1', [slot_id]);
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23505') {
      return res.status(409).json({ message: 'Слот уже занят' });
    }
    console.error('Failed to create doctor appointment', e);
    res.status(500).json({ message: 'Не удалось создать запись' });
  } finally {
    client.release();
  }
});

// PATCH /api/appointments/:id/complete  (doctor closes own active appointment)
router.patch('/:id/complete', auth(['doctor']), async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const doc = await client.query('SELECT id FROM doctors WHERE user_id=$1', [req.user.id]);
    if (!doc.rows.length) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Профиль врача не найден' });
    }

    const appt = await client.query(
      `SELECT a.*
       FROM appointments a
       JOIN slots s ON s.id = a.slot_id
       WHERE a.id=$1 AND s.doctor_id=$2
       FOR UPDATE OF a`,
      [id, doc.rows[0].id]
    );
    if (!appt.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Запись не найдена' });
    }
    if (appt.rows[0].status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Можно закрыть только активную запись' });
    }

    await client.query(`UPDATE appointments SET status='completed' WHERE id=$1`, [id]);
    await client.query('UPDATE slots SET is_available=FALSE WHERE id=$1', [appt.rows[0].slot_id]);
    await client.query('COMMIT');
    res.json({ ok: true, status: 'completed' });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Failed to complete appointment', e);
    res.status(500).json({ message: 'Не удалось закрыть запись' });
  } finally {
    client.release();
  }
});

// PATCH /api/appointments/:id/status  (admin)
router.patch('/:id/status', auth(['admin']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['active', 'cancelled', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'Недопустимый статус' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const appt = await client.query('SELECT * FROM appointments WHERE id=$1 FOR UPDATE', [id]);
    if (!appt.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    await client.query(`UPDATE appointments SET status=$1 WHERE id=$2`, [status, id]);
    await client.query(
      'UPDATE slots SET is_available=$1 WHERE id=$2',
      [status === 'cancelled', appt.rows[0].slot_id]
    );
    await client.query('COMMIT');
    res.json({ ok: true, status });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Failed to update appointment status', e);
    res.status(500).json({ message: 'Не удалось обновить запись' });
  } finally {
    client.release();
  }
});

// DELETE /api/appointments/:id  (patient cancels own, admin cancels any)
router.delete('/:id', auth(['patient', 'admin']), async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const appt = await client.query('SELECT * FROM appointments WHERE id=$1 FOR UPDATE', [id]);
    if (!appt.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    const a = appt.rows[0];
    if (req.user.role === 'patient' && a.patient_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Нет доступа' });
    }
    if (a.status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Запись уже отменена или завершена' });
    }

    await client.query(`UPDATE appointments SET status='cancelled' WHERE id=$1`, [id]);
    await client.query('UPDATE slots SET is_available=TRUE WHERE id=$1', [a.slot_id]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Failed to cancel appointment', e);
    res.status(500).json({ message: 'Не удалось отменить запись' });
  } finally {
    client.release();
  }
});

module.exports = router;
