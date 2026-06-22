const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

// GET /api/specializations
router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT id, name FROM specializations ORDER BY name');
  res.json(rows);
});

// POST /api/specializations  (admin)
router.post('/', auth(['admin']), async (req, res) => {
  const name = req.body.name?.trim();
  if (!name) return res.status(400).json({ message: 'Укажите название специализации' });

  try {
    const { rows } = await pool.query(
      'INSERT INTO specializations (name) VALUES ($1) RETURNING id, name',
      [name]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Такая специализация уже существует' });
    throw err;
  }
});

// DELETE /api/specializations/:id  (admin)
router.delete('/:id', auth(['admin']), async (req, res) => {
  const used = await pool.query('SELECT id FROM doctors WHERE specialization_id=$1 LIMIT 1', [req.params.id]);
  if (used.rows.length) {
    return res.status(409).json({ message: 'Специализация используется врачами. Сначала переназначьте врачей.' });
  }
  const { rows } = await pool.query('DELETE FROM specializations WHERE id=$1 RETURNING id', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Специализация не найдена' });
  res.json({ ok: true });
});

module.exports = router;
