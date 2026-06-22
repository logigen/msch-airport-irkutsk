const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const CLINIC_TZ = 'Asia/Irkutsk';
const CLINIC_OFFSET = '+08:00';
const SLOT_MINUTES = 30;
const BOOKING_DAYS_AHEAD = 7;
const CLINIC_START = '08:00';
const WEEKDAY_END = '16:00';
const SATURDAY_END = '14:00';

const dateInClinic = (date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: CLINIC_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(date);

const addDays = (dateKey, days) => {
  const date = new Date(`${dateKey}T12:00:00${CLINIC_OFFSET}`);
  date.setUTCDate(date.getUTCDate() + days);
  return dateInClinic(date);
};

const clinicDateTime = (dateKey, time) => `${dateKey}T${time}:00${CLINIC_OFFSET}`;

const normalizeTime = (value) => String(value || '').slice(0, 5);

const maxDate = (a, b) => (a > b ? a : b);
const minDate = (a, b) => (a < b ? a : b);
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

const getDoctor = async (doctorId, client = pool) => {
  const { rows } = await client.query(
    `SELECT
       id,
       to_char(work_start, 'HH24:MI') AS work_start,
       to_char(work_end, 'HH24:MI') AS work_end
     FROM doctors WHERE id=$1`,
    [doctorId]
  );
  return rows[0];
};

const validateSlotBounds = async (doctorId, startedAt, endedAt, client = pool) => {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return 'Время окончания должно быть позже начала';
  }
  if (start <= new Date() || start > bookingWindowEnd()) {
    return 'Запись доступна только на ближайшие 7 дней';
  }

  const doctor = await getDoctor(doctorId, client);
  if (!doctor) return 'Врач не найден';

  const startParts = clinicParts(start);
  const endParts = clinicParts(end);
  if (startParts.dateKey !== endParts.dateKey) {
    return 'Слот должен начинаться и заканчиваться в один день';
  }

  const clinicHours = clinicHoursForDate(startParts.dateKey);
  if (!clinicHours) return 'В этот день медсанчасть не работает';

  const availableStart = maxTime(normalizeTime(doctor.work_start || CLINIC_START), clinicHours.start);
  const availableEnd = minTime(normalizeTime(doctor.work_end || WEEKDAY_END), clinicHours.end);
  if (availableEnd <= availableStart || startParts.time < availableStart || endParts.time > availableEnd) {
    return `Слот должен быть в рабочее время: ${availableStart} — ${availableEnd}`;
  }

  return '';
};

const generateMissingSlots = async (doctorId, dateFrom, dateTo) => {
  if (!dateFrom || !dateTo) return;

  const doctor = await getDoctor(doctorId);
  if (!doctor) return;

  const workStart = normalizeTime(doctor.work_start || CLINIC_START);
  const workEnd = normalizeTime(doctor.work_end || WEEKDAY_END);
  const fromKey = dateInClinic(new Date(dateFrom));
  const toKey = dateInClinic(new Date(dateTo));
  let dayKey = fromKey;

  while (dayKey <= toKey) {
    const clinicHours = clinicHoursForDate(dayKey);
    if (clinicHours) {
      const dayStart = maxTime(workStart, clinicHours.start);
      const dayEndTime = minTime(workEnd, clinicHours.end);

      if (dayEndTime <= dayStart) {
        dayKey = addDays(dayKey, 1);
        continue;
      }

      let cursor = new Date(clinicDateTime(dayKey, dayStart));
      const dayEnd = new Date(clinicDateTime(dayKey, dayEndTime));

      while (cursor < dayEnd) {
        const slotEnd = new Date(cursor.getTime() + SLOT_MINUTES * 60000);
        if (slotEnd > dayEnd) break;

        await pool.query(
          `INSERT INTO slots (doctor_id, started_at, ended_at)
           SELECT $1, $2, $3
           WHERE NOT EXISTS (
             SELECT 1 FROM slots
             WHERE doctor_id=$1 AND started_at=$2 AND ended_at=$3
           )`,
          [doctorId, cursor.toISOString(), slotEnd.toISOString()]
        );
        cursor = slotEnd;
      }
    }
    dayKey = addDays(dayKey, 1);
  }
};

// GET /api/slots?doctor_id=&date_from=&date_to=
router.get('/', async (req, res) => {
  const { doctor_id, date_from, date_to } = req.query;
  if (!doctor_id) return res.status(400).json({ message: 'Укажите doctor_id' });

  const now = new Date();
  const windowEnd = bookingWindowEnd();
  const requestedFrom = date_from ? new Date(date_from) : now;
  const requestedTo = date_to ? new Date(date_to) : windowEnd;
  const effectiveFrom = maxDate(Number.isNaN(requestedFrom.getTime()) ? now : requestedFrom, now);
  const effectiveTo = minDate(Number.isNaN(requestedTo.getTime()) ? windowEnd : requestedTo, windowEnd);

  if (effectiveTo < effectiveFrom) return res.json([]);

  await generateMissingSlots(doctor_id, effectiveFrom.toISOString(), effectiveTo.toISOString());

  const params = [doctor_id];
  let q = `
    SELECT s.*
    FROM slots s
    JOIN doctors d ON d.id = s.doctor_id
    WHERE s.doctor_id=$1
      AND EXTRACT(DOW FROM s.started_at AT TIME ZONE '${CLINIC_TZ}') BETWEEN 1 AND 6
      AND (s.started_at AT TIME ZONE '${CLINIC_TZ}')::time >= GREATEST(d.work_start, TIME '${CLINIC_START}')
      AND (s.ended_at AT TIME ZONE '${CLINIC_TZ}')::time <= LEAST(
        d.work_end,
        CASE
          WHEN EXTRACT(DOW FROM s.started_at AT TIME ZONE '${CLINIC_TZ}') = 6 THEN TIME '${SATURDAY_END}'
          ELSE TIME '${WEEKDAY_END}'
        END
      )`;
  params.push(effectiveFrom.toISOString());
  q += ` AND started_at >= $${params.length}`;
  params.push(effectiveTo.toISOString());
  q += ` AND started_at <= $${params.length}`;
  q += ' ORDER BY started_at';

  const { rows } = await pool.query(q, params);
  res.json(rows);
});

// GET /api/slots/:id
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT
       s.*,
       json_build_object(
         'id', d.id,
         'experience', d.experience,
         'bio', d.bio,
         'work_start', to_char(d.work_start, 'HH24:MI'),
         'work_end', to_char(d.work_end, 'HH24:MI'),
         'specialization_id', d.specialization_id,
         'user', json_build_object('id', u.id, 'full_name', u.full_name, 'email', u.email),
         'specialization', json_build_object('id', sp.id, 'name', sp.name)
       ) AS doctor
     FROM slots s
     JOIN doctors d ON d.id = s.doctor_id
     JOIN users u ON u.id = d.user_id
     JOIN specializations sp ON sp.id = d.specialization_id
     WHERE s.id=$1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Слот не найден' });

  const { doctor, ...slot } = rows[0];
  res.json({ slot, doctor });
});

// POST /api/slots  (doctor — свой профиль, admin — любой врач)
router.post('/', auth(['doctor', 'admin']), async (req, res) => {
  const { started_at, ended_at, doctor_id } = req.body;
  if (!started_at || !ended_at) return res.status(400).json({ message: 'Укажите started_at и ended_at' });

  let docId;
  if (req.user.role === 'admin') {
    if (!doctor_id) return res.status(400).json({ message: 'Укажите doctor_id' });
    const doc = await pool.query('SELECT id FROM doctors WHERE id=$1', [doctor_id]);
    if (!doc.rows.length) return res.status(404).json({ message: 'Врач не найден' });
    docId = doctor_id;
  } else {
    const doc = await pool.query('SELECT id FROM doctors WHERE user_id=$1', [req.user.id]);
    if (!doc.rows.length) return res.status(403).json({ message: 'Профиль врача не найден' });
    docId = doc.rows[0].id;
  }

  const boundsError = await validateSlotBounds(docId, started_at, ended_at);
  if (boundsError) return res.status(400).json({ message: boundsError });

  const { rows } = await pool.query(
    `INSERT INTO slots (doctor_id, started_at, ended_at) VALUES ($1,$2,$3) RETURNING *`,
    [docId, started_at, ended_at]
  );
  res.status(201).json(rows[0]);
});

// POST /api/slots/bulk  (admin) — слоты на день с интервалом
router.post('/bulk', auth(['admin']), async (req, res) => {
  const { doctor_id, date, from_time, to_time, duration_minutes = 30 } = req.body;

  if (!doctor_id || !date || !from_time || !to_time) {
    return res.status(400).json({ message: 'Укажите doctor_id, date, from_time, to_time' });
  }

  const doctor = await getDoctor(doctor_id);
  if (!doctor) return res.status(404).json({ message: 'Врач не найден' });

  const duration = Number(duration_minutes);
  if (duration < 10 || duration > 180) {
    return res.status(400).json({ message: 'Интервал приёма: от 10 до 180 минут' });
  }

  const clinicHours = clinicHoursForDate(date);
  if (!clinicHours) return res.status(400).json({ message: 'В этот день медсанчасть не работает' });

  const availableStart = maxTime(normalizeTime(doctor.work_start || CLINIC_START), clinicHours.start);
  const availableEnd = minTime(normalizeTime(doctor.work_end || WEEKDAY_END), clinicHours.end);
  const actualFrom = maxTime(normalizeTime(from_time), availableStart);
  const actualTo = minTime(normalizeTime(to_time), availableEnd);
  if (actualTo <= actualFrom) {
    return res.status(400).json({ message: `Расписание должно быть в рабочее время: ${availableStart} — ${availableEnd}` });
  }

  const start = new Date(clinicDateTime(date, actualFrom));
  const end = new Date(clinicDateTime(date, actualTo));

  if (end <= start) return res.status(400).json({ message: 'Время окончания должно быть позже начала' });
  const now = new Date();
  if (end <= now || start > bookingWindowEnd()) {
    return res.status(400).json({ message: 'Запись доступна только на ближайшие 7 дней' });
  }

  const created = [];
  const cur = new Date(maxDate(start, now));
  const remainder = cur.getMinutes() % duration;
  if (remainder || cur.getSeconds() || cur.getMilliseconds()) {
    cur.setMinutes(cur.getMinutes() + (duration - remainder), 0, 0);
  }
  while (cur < end) {
    const slotEnd = new Date(cur.getTime() + duration * 60000);
    if (slotEnd > end) break;

    const { rows } = await pool.query(
      `INSERT INTO slots (doctor_id, started_at, ended_at)
       SELECT $1, $2, $3
       WHERE NOT EXISTS (
         SELECT 1 FROM slots
         WHERE doctor_id=$1 AND started_at=$2 AND ended_at=$3
       )
       RETURNING *`,
      [doctor_id, cur.toISOString(), slotEnd.toISOString()]
    );
    if (rows[0]) created.push(rows[0]);
    cur.setTime(slotEnd.getTime());
  }

  res.status(201).json(created);
});

// DELETE /api/slots/:id  (admin или врач-владелец)
router.delete('/:id', auth(['doctor', 'admin']), async (req, res) => {
  const slot = await pool.query(
    `SELECT s.*, d.user_id FROM slots s JOIN doctors d ON d.id = s.doctor_id WHERE s.id=$1`,
    [req.params.id]
  );
  if (!slot.rows.length) return res.status(404).json({ message: 'Слот не найден' });

  const { user_id, is_available } = slot.rows[0];
  if (!is_available) return res.status(409).json({ message: 'Нельзя удалить занятый слот' });

  if (req.user.role === 'doctor' && user_id !== req.user.id) {
    return res.status(403).json({ message: 'Нет доступа' });
  }

  await pool.query('DELETE FROM slots WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
