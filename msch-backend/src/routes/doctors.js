const router = require('express').Router();
const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const DOCTOR_SELECT = `
  SELECT
    d.id,
    d.experience,
    d.bio,
    to_char(d.work_start, 'HH24:MI') AS work_start,
    to_char(d.work_end, 'HH24:MI') AS work_end,
    d.specialization_id,
    d.user_id,
    d.created_at,
    json_build_object('id', u.id, 'full_name', u.full_name, 'email', u.email) AS "user",
    json_build_object('id', s.id, 'name', s.name) AS specialization
  FROM doctors d
  JOIN users u ON u.id = d.user_id
  JOIN specializations s ON s.id = d.specialization_id
`;

const isTime = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const validateWorkHours = (workStart, workEnd) => {
  if (!isTime(workStart) || !isTime(workEnd)) {
    return 'Укажите рабочее время в формате ЧЧ:ММ';
  }
  if (workEnd <= workStart) {
    return 'Окончание рабочего дня должно быть позже начала';
  }
  return '';
};

// GET /api/doctors
router.get('/', async (req, res) => {
  const { rows } = await pool.query(`${DOCTOR_SELECT} ORDER BY u.full_name`);
  res.json(rows);
});

// GET /api/doctors/me
router.get('/me', auth(['doctor']), async (req, res) => {
  const { rows } = await pool.query(`${DOCTOR_SELECT} WHERE d.user_id=$1`, [req.user.id]);
  if (!rows.length) return res.status(404).json({ message: 'Профиль врача не найден' });
  res.json(rows[0]);
});

// GET /api/doctors/:id
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(`${DOCTOR_SELECT} WHERE d.id=$1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Врач не найден' });
  res.json(rows[0]);
});

// POST /api/doctors  (admin)
router.post('/', auth(['admin']), async (req, res) => {
  const { user_id, full_name, email, password, specialization_id, experience, bio, work_start, work_end } = req.body;
  const workStart = work_start || '08:00';
  const workEnd = work_end || '16:00';
  const workHoursError = validateWorkHours(workStart, workEnd);
  if (workHoursError) return res.status(400).json({ message: workHoursError });

  if (!specialization_id || experience === undefined || experience === null) {
    return res.status(400).json({ message: 'Укажите специализацию и стаж' });
  }
  if (Number(experience) < 0) return res.status(400).json({ message: 'Стаж не может быть отрицательным' });

  const spec = await pool.query('SELECT id FROM specializations WHERE id=$1', [specialization_id]);
  if (!spec.rows.length) return res.status(400).json({ message: 'Специализация не найдена' });

  let uid = user_id;

  if (uid) {
    const user = await pool.query('SELECT id, role FROM users WHERE id=$1', [uid]);
    if (!user.rows.length) return res.status(404).json({ message: 'Пользователь не найден' });
    if (user.rows[0].role !== 'doctor') {
      await pool.query('UPDATE users SET role=$1 WHERE id=$2', ['doctor', uid]);
    }
    const exists = await pool.query('SELECT id FROM doctors WHERE user_id=$1', [uid]);
    if (exists.rows.length) return res.status(409).json({ message: 'У этого пользователя уже есть профиль врача' });
  } else {
    if (!full_name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'Укажите ФИО, email и пароль для нового врача' });
    }
    if (password.length < 8) return res.status(400).json({ message: 'Пароль минимум 8 символов' });

    const emailTaken = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase().trim()]);
    if (emailTaken.rows.length) return res.status(409).json({ message: 'Email уже занят' });

    const hash = await bcrypt.hash(password, 10);
    const { rows: newUser } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'doctor') RETURNING id`,
      [full_name.trim(), email.toLowerCase().trim(), hash]
    );
    uid = newUser[0].id;
  }

  const { rows } = await pool.query(
    `INSERT INTO doctors (user_id, specialization_id, experience, bio, work_start, work_end)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [uid, specialization_id, Number(experience), bio?.trim() || null, workStart, workEnd]
  );

  const { rows: doctor } = await pool.query(`${DOCTOR_SELECT} WHERE d.id=$1`, [rows[0].id]);
  res.status(201).json(doctor[0]);
});

// PUT /api/doctors/:id  (admin)
router.put('/:id', auth(['admin']), async (req, res) => {
  const { specialization_id, experience, bio, work_start, work_end } = req.body;
  const updates = [];
  const values = [];
  let i = 1;

  if (specialization_id !== undefined) {
    const spec = await pool.query('SELECT id FROM specializations WHERE id=$1', [specialization_id]);
    if (!spec.rows.length) return res.status(400).json({ message: 'Специализация не найдена' });
    updates.push(`specialization_id = $${i++}`);
    values.push(specialization_id);
  }
  if (experience !== undefined) {
    if (Number(experience) < 0) return res.status(400).json({ message: 'Стаж не может быть отрицательным' });
    updates.push(`experience = $${i++}`);
    values.push(Number(experience));
  }
  if (bio !== undefined) {
    updates.push(`bio = $${i++}`);
    values.push(bio?.trim() || null);
  }
  if (work_start !== undefined || work_end !== undefined) {
    const current = await pool.query(
      `SELECT to_char(work_start, 'HH24:MI') AS work_start, to_char(work_end, 'HH24:MI') AS work_end
       FROM doctors WHERE id=$1`,
      [req.params.id]
    );
    if (!current.rows.length) return res.status(404).json({ message: 'Врач не найден' });

    const workStart = work_start ?? current.rows[0].work_start;
    const workEnd = work_end ?? current.rows[0].work_end;
    const workHoursError = validateWorkHours(workStart, workEnd);
    if (workHoursError) return res.status(400).json({ message: workHoursError });

    updates.push(`work_start = $${i++}`);
    values.push(workStart);
    updates.push(`work_end = $${i++}`);
    values.push(workEnd);
  }

  if (!updates.length) return res.status(400).json({ message: 'Нет данных для обновления' });

  values.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE doctors SET ${updates.join(', ')} WHERE id = $${i} RETURNING id`,
    values
  );
  if (!rows.length) return res.status(404).json({ message: 'Врач не найден' });

  const { rows: doctor } = await pool.query(`${DOCTOR_SELECT} WHERE d.id=$1`, [rows[0].id]);
  res.json(doctor[0]);
});

// DELETE /api/doctors/:id  (admin)
router.delete('/:id', auth(['admin']), async (req, res) => {
  const doc = await pool.query('SELECT user_id FROM doctors WHERE id=$1', [req.params.id]);
  if (!doc.rows.length) return res.status(404).json({ message: 'Врач не найден' });

  await pool.query('DELETE FROM doctors WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
