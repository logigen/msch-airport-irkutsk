const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const { DEFAULT_LOGO_DATA_URL, DEFAULT_SERVICES } = require('../db/settings');

const normalizeServices = (services) => {
  if (!Array.isArray(services)) return null;

  return services
    .map((group) => ({
      category: String(group.category || '').trim(),
      color: /^#[0-9a-fA-F]{6}$/.test(group.color) ? group.color : '#1a4a8a',
      items: Array.isArray(group.items)
        ? group.items
            .map((item) => ({
              name: String(item.name || '').trim(),
              price: String(item.price || '').trim(),
            }))
            .filter((item) => item.name && item.price)
        : [],
    }))
    .filter((group) => group.category && group.items.length);
};

// GET /api/settings/logo
router.get('/logo', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT value FROM app_settings WHERE key='airport_logo'`
  );
  res.json({ logo: rows[0]?.value || DEFAULT_LOGO_DATA_URL });
});

// PUT /api/settings/logo  (admin)
router.put('/logo', auth(['admin']), async (req, res) => {
  const { logo } = req.body;
  if (!logo || typeof logo !== 'string' || !logo.startsWith('data:image/')) {
    return res.status(400).json({ message: 'Нужен логотип в формате data:image/...' });
  }

  const { rows } = await pool.query(
    `INSERT INTO app_settings (key, value)
     VALUES ('airport_logo', $1)
     ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value,
           updated_at = NOW()
     RETURNING value`,
    [logo]
  );

  res.json({ logo: rows[0].value });
});

// GET /api/settings/services
router.get('/services', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT value FROM app_settings WHERE key='services_price_list'`
  );

  try {
    res.json({ services: rows[0]?.value ? JSON.parse(rows[0].value) : DEFAULT_SERVICES });
  } catch {
    res.json({ services: DEFAULT_SERVICES });
  }
});

// PUT /api/settings/services  (admin)
router.put('/services', auth(['admin']), async (req, res) => {
  const services = normalizeServices(req.body.services);
  if (!services) {
    return res.status(400).json({ message: 'Передайте список услуг' });
  }
  if (!services.length) {
    return res.status(400).json({ message: 'Добавьте хотя бы одну категорию и услугу' });
  }

  const { rows } = await pool.query(
    `INSERT INTO app_settings (key, value)
     VALUES ('services_price_list', $1)
     ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value,
           updated_at = NOW()
     RETURNING value`,
    [JSON.stringify(services)]
  );

  res.json({ services: JSON.parse(rows[0].value) });
});

module.exports = router;
