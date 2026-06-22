const router = require('express').Router();
const bcrypt = require('bcrypt');
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

// GET /api/users  (admin)
router.get('/', auth(['admin']), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, full_name, email, role, date_created FROM users ORDER BY date_created DESC`
  );
  res.json(rows);
});

// GET /api/users/patients  (doctor/admin)
router.get('/patients', auth(['doctor', 'admin']), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, full_name, email
     FROM users
     WHERE role='patient'
     ORDER BY full_name`
  );
  res.json(rows);
});

// PATCH /api/users/:id/role  (admin)
router.patch('/:id/role', auth(['admin']), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['patient', 'doctor'].includes(role)) {
    return res.status(400).json({ message: 'Можно назначить только роль patient или doctor' });
  }

  const target = await pool.query('SELECT id, role FROM users WHERE id=$1', [id]);
  if (!target.rows.length) return res.status(404).json({ message: 'Пользователь не найден' });
  if (target.rows[0].role === 'admin') return res.status(403).json({ message: 'Нельзя менять роль администратора' });

  const { rows } = await pool.query(
    `UPDATE users SET role=$1 WHERE id=$2 RETURNING id, full_name, email, role, date_created`,
    [role, id]
  );
  res.json(rows[0]);
});

// DELETE /api/users/:id  (admin)
router.delete('/:id', auth(['admin']), async (req, res) => {
  const { id } = req.params;
  const self = await pool.query('SELECT role FROM users WHERE id=$1', [id]);
  if (!self.rows.length) return res.status(404).json({ message: 'Пользователь не найден' });
  if (self.rows[0].role === 'admin') return res.status(403).json({ message: 'Нельзя удалить администратора' });
  await pool.query('DELETE FROM users WHERE id=$1', [id]);
  res.json({ ok: true });
});

// PUT /api/users/me  (patient updates own profile)
router.put('/me', auth(['patient', 'doctor', 'admin']), async (req, res) => {
  const { full_name, email, password } = req.body;
  const updates = [];
  const values  = [];
  let i = 1;

  if (full_name) { updates.push(`full_name=$${i++}`); values.push(full_name.trim()); }
  if (email)     { updates.push(`email=$${i++}`);     values.push(email.toLowerCase().trim()); }
  if (password) {
    if (password.length < 8) return res.status(400).json({ message: 'Пароль минимум 8 символов' });
    const hash = await bcrypt.hash(password, 10);
    updates.push(`password_hash=$${i++}`);
    values.push(hash);
  }
  if (!updates.length) return res.status(400).json({ message: 'Нет данных для обновления' });

  values.push(req.user.id);
  const { rows } = await pool.query(
    `UPDATE users SET ${updates.join(',')} WHERE id=$${i} RETURNING id,full_name,email,role`,
    values
  );
  res.json(rows[0]);
});

module.exports = router;
