const pool = require('./pool');

const AIRPORT_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="345" height="99" viewBox="0 0 345 99" role="img" aria-label="Международный аэропорт Иркутск">
  <rect width="345" height="99" fill="none"/>
  <g fill="#0d5ca8" stroke="#ffffff" stroke-width="1.4" paint-order="stroke fill">
    <path d="M36 2h20l12 34h-67v-11h42l-7-23z"/>
    <path d="M1 45h78v9h-78z"/>
    <path d="M68 63l-12 34h-20l7-23h-42v-11h67z"/>
  </g>
  <g fill="#0d5ca8" stroke="#ffffff" stroke-width="1.1" paint-order="stroke fill" font-family="Arial, Helvetica, sans-serif" font-weight="800">
    <text x="91" y="17" font-size="20" letter-spacing="2.8">МЕЖДУНАРОДНЫЙ</text>
    <text x="91" y="42" font-size="20" letter-spacing="12">АЭРОПОРТ</text>
    <text x="88" y="96" font-size="61" letter-spacing="-2">Иркутск</text>
  </g>
</svg>`.trim();

const DEFAULT_LOGO_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(AIRPORT_LOGO_SVG)}`;

const DEFAULT_SERVICES = [
  {
    category: 'Амбулаторный приём',
    color: '#1a4a8a',
    items: [
      { name: 'Приём терапевта (первичный)', price: '800 ₽' },
      { name: 'Приём терапевта (повторный)', price: '600 ₽' },
      { name: 'Приём невролога', price: '900 ₽' },
      { name: 'Приём офтальмолога', price: '900 ₽' },
      { name: 'Приём отоларинголога', price: '850 ₽' },
      { name: 'Приём хирурга', price: '900 ₽' },
    ],
  },
  {
    category: 'Авиационная медицина',
    color: '#0d5c36',
    items: [
      { name: 'Медицинское освидетельствование (КВС, 2ПЛ)', price: '3 200 ₽' },
      { name: 'Предполётный медосмотр', price: '350 ₽' },
      { name: 'Периодический медосмотр (1 категория)', price: '2 800 ₽' },
      { name: 'Внеочередной осмотр', price: '1 500 ₽' },
    ],
  },
  {
    category: 'Лабораторная диагностика',
    color: '#5c350d',
    items: [
      { name: 'Общий анализ крови (развёрнутый)', price: '450 ₽' },
      { name: 'Биохимический анализ крови', price: '650 ₽' },
      { name: 'Общий анализ мочи', price: '250 ₽' },
      { name: 'Гликированный гемоглобин', price: '550 ₽' },
      { name: 'ПСА (онкомаркер)', price: '700 ₽' },
    ],
  },
  {
    category: 'Инструментальная диагностика',
    color: '#4a1a8a',
    items: [
      { name: 'ЭКГ с расшифровкой', price: '500 ₽' },
      { name: 'Флюорография цифровая', price: '400 ₽' },
      { name: 'Рентгенография (1 проекция)', price: '550 ₽' },
      { name: 'Суточное мониторирование ЭКГ (Холтер)', price: '2 200 ₽' },
      { name: 'Спирометрия', price: '700 ₽' },
    ],
  },
];

async function ensureSettings() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(
    `INSERT INTO app_settings (key, value)
     VALUES ('airport_logo', $1)
     ON CONFLICT (key) DO NOTHING`,
    [DEFAULT_LOGO_DATA_URL]
  );

  await pool.query(
    `INSERT INTO app_settings (key, value)
     VALUES ('services_price_list', $1)
     ON CONFLICT (key) DO NOTHING`,
    [JSON.stringify(DEFAULT_SERVICES)]
  );

  await pool.query(`
    DO $$
    BEGIN
      IF to_regclass('public.doctors') IS NOT NULL THEN
        ALTER TABLE doctors
          ADD COLUMN IF NOT EXISTS work_start TIME NOT NULL DEFAULT TIME '08:00',
          ADD COLUMN IF NOT EXISTS work_end TIME NOT NULL DEFAULT TIME '16:00';
      END IF;
    END $$;
  `);
}

module.exports = {
  DEFAULT_LOGO_DATA_URL,
  DEFAULT_SERVICES,
  ensureSettings,
};
