const router  = require('express').Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/pool');

const SALT_ROUNDS    = 10;
const ACCESS_EXPIRE  = '15m';
const REFRESH_EXPIRE = '7d';
const REFRESH_MS     = 7 * 24 * 60 * 60 * 1000;

function makeTokens(user) {
  const payload = { id: user.id, role: user.role };
  const access  = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRE });
  const refresh = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRE });
  return { access, refresh };
}

function publicUser(u) {
  return { id: u.id, full_name: u.full_name, email: u.email, role: u.role };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { full_name, email, password } = req.body;
  if (!full_name || !email || !password) return res.status(400).json({ message: 'Заполните все поля' });
  if (password.length < 8) return res.status(400).json({ message: 'Пароль минимум 8 символов' });

  try {
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length) return res.status(409).json({ message: 'Email уже занят' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1,$2,$3,'patient') RETURNING *`,
      [full_name.trim(), email.toLowerCase().trim(), hash]
    );
    const user = rows[0];
    const { access, refresh } = makeTokens(user);
    const exp = new Date(Date.now() + REFRESH_MS);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)',
      [user.id, refresh, exp]
    );
    res.status(201).json({ access, refresh, user: publicUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Заполните все поля' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase().trim()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Неверный email или пароль' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Неверный email или пароль' });

    const { access, refresh } = makeTokens(user);
    const exp = new Date(Date.now() + REFRESH_MS);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)',
      [user.id, refresh, exp]
    );
    res.json({ access, refresh, user: publicUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(400).json({ message: 'Нет refresh-токена' });

  try {
    const payload = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
    const { rows } = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token=$1 AND expires_at > NOW()',
      [refresh]
    );
    if (!rows.length) return res.status(401).json({ message: 'Токен отозван или просрочен' });

    const user = await pool.query('SELECT * FROM users WHERE id=$1', [payload.id]);
    if (!user.rows.length) return res.status(401).json({ message: 'Пользователь не найден' });

    await pool.query('DELETE FROM refresh_tokens WHERE token=$1', [refresh]);
    const tokens = makeTokens(user.rows[0]);
    const exp = new Date(Date.now() + REFRESH_MS);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)',
      [user.rows[0].id, tokens.refresh, exp]
    );
    res.json(tokens);
  } catch {
    res.status(401).json({ message: 'Недействительный refresh-токен' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const { refresh } = req.body;
  if (refresh) {
    await pool.query('DELETE FROM refresh_tokens WHERE token=$1', [refresh]).catch(() => {});
  }
  res.json({ ok: true });
});

module.exports = router;
