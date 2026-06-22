const pool = require('./pool');

const PLACEHOLDER_PHOTOS = [
  {
    caption: 'Медико-санитарная часть аэропорта Иркутск',
    image: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500" viewBox="0 0 1200 500">
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4a8fd4"/>
            <stop offset="50%" stop-color="#2d6cb5"/>
            <stop offset="100%" stop-color="#1a4a8a"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="500" fill="url(#g1)" rx="0"/>
        <circle cx="950" cy="120" r="200" fill="rgba(255,255,255,0.08)"/>
        <circle cx="200" cy="400" r="150" fill="rgba(255,255,255,0.06)"/>
        <text x="60" y="260" font-family="Arial,sans-serif" font-size="42" font-weight="700" fill="white">МСЧ Аэропорт Иркутск</text>
        <text x="60" y="310" font-family="Arial,sans-serif" font-size="20" fill="rgba(255,255,255,0.75)">Медицинская помощь с 1934 года</text>
      </svg>
    `.trim())}`,
    sort_order: 0,
  },
  {
    caption: 'Современное медицинское оборудование',
    image: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500" viewBox="0 0 1200 500">
        <defs>
          <linearGradient id="g2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#e8f2fc"/>
            <stop offset="40%" stop-color="#6baee8"/>
            <stop offset="100%" stop-color="#2d6cb5"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="500" fill="url(#g2)"/>
        <ellipse cx="600" cy="250" rx="300" ry="180" fill="rgba(255,255,255,0.15)"/>
        <text x="60" y="260" font-family="Arial,sans-serif" font-size="36" font-weight="700" fill="white">Клиническая база ИГМУ</text>
        <text x="60" y="305" font-family="Arial,sans-serif" font-size="18" fill="rgba(255,255,255,0.8)">Первая категория Минздрава</text>
      </svg>
    `.trim())}`,
    sort_order: 1,
  },
  {
    caption: 'Квалифицированные специалисты',
    image: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500" viewBox="0 0 1200 500">
        <defs>
          <linearGradient id="g3" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stop-color="#1a4a8a"/>
            <stop offset="100%" stop-color="#5ba3e8"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="500" fill="url(#g3)"/>
        <circle cx="1000" cy="350" r="220" fill="rgba(255,255,255,0.07)"/>
        <text x="60" y="250" font-family="Arial,sans-serif" font-size="36" font-weight="700" fill="white">24 специалиста</text>
        <text x="60" y="295" font-family="Arial,sans-serif" font-size="18" fill="rgba(255,255,255,0.8)">12 направлений медицинской помощи</text>
      </svg>
    `.trim())}`,
    sort_order: 2,
  },
];

async function ensureGallery() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gallery_photos (
      id         SERIAL PRIMARY KEY,
      image      TEXT        NOT NULL,
      caption    VARCHAR(255),
      sort_order INT         NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const { rows } = await pool.query('SELECT COUNT(*)::int AS cnt FROM gallery_photos');
  if (rows[0].cnt === 0) {
    for (const photo of PLACEHOLDER_PHOTOS) {
      await pool.query(
        `INSERT INTO gallery_photos (image, caption, sort_order) VALUES ($1, $2, $3)`,
        [photo.image, photo.caption, photo.sort_order]
      );
    }
  }
}

module.exports = { ensureGallery };
