const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

// GET /api/gallery
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, image, caption, sort_order, created_at
     FROM gallery_photos
     ORDER BY sort_order ASC, id ASC`
  );
  res.json(rows);
});

// POST /api/gallery  (admin)
router.post('/', auth(['admin']), async (req, res) => {
  const { image, caption } = req.body;
  if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
    return res.status(400).json({ message: 'Нужно изображение в формате data:image/...' });
  }

  const { rows: maxRows } = await pool.query(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM gallery_photos`
  );

  const { rows } = await pool.query(
    `INSERT INTO gallery_photos (image, caption, sort_order)
     VALUES ($1, $2, $3)
     RETURNING id, image, caption, sort_order, created_at`,
    [image, caption || '', maxRows[0].next_order]
  );

  res.status(201).json(rows[0]);
});

// PUT /api/gallery/:id  (admin)
router.put('/:id', auth(['admin']), async (req, res) => {
  const { id } = req.params;
  const { image, caption, sort_order } = req.body;

  const updates = [];
  const values = [];
  let idx = 1;

  if (image !== undefined) {
    if (typeof image !== 'string' || !image.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Нужно изображение в формате data:image/...' });
    }
    updates.push(`image = $${idx++}`);
    values.push(image);
  }
  if (caption !== undefined) {
    updates.push(`caption = $${idx++}`);
    values.push(caption);
  }
  if (sort_order !== undefined) {
    updates.push(`sort_order = $${idx++}`);
    values.push(sort_order);
  }

  if (!updates.length) {
    return res.status(400).json({ message: 'Нет данных для обновления' });
  }

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE gallery_photos SET ${updates.join(', ')} WHERE id = $${idx}
     RETURNING id, image, caption, sort_order, created_at`,
    values
  );

  if (!rows.length) return res.status(404).json({ message: 'Фото не найдено' });
  res.json(rows[0]);
});

// DELETE /api/gallery/:id  (admin)
router.delete('/:id', auth(['admin']), async (req, res) => {
  const { rows } = await pool.query(
    `DELETE FROM gallery_photos WHERE id = $1 RETURNING id`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Фото не найдено' });
  res.json({ ok: true });
});

module.exports = router;
