-- ============================================================
-- seed.sql — демо-данные для локальной разработки
-- Запускается автоматически при первом старте контейнера БД
-- ============================================================

-- bcrypt-хеш тестового пароля (не храните пароль в открытом виде в репозитории)

INSERT INTO users (full_name, email, password_hash, role) VALUES
  ('Администратор', 'admin@demo.local',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (full_name, email, password_hash, role) VALUES
  ('Иванова А. Н.', 'doctor1@demo.local',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor'),
  ('Петров В. С.', 'doctor2@demo.local',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor'),
  ('Козлова М. А.', 'doctor3@demo.local',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor')
ON CONFLICT (email) DO NOTHING;

INSERT INTO doctors (user_id, specialization_id, experience, bio)
SELECT u.id, s.id, 12,
       'Специалист по диагностике и лечению заболеваний сердечно-сосудистой системы.'
FROM users u, specializations s
WHERE u.email='doctor1@demo.local' AND s.name='Кардиолог'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO doctors (user_id, specialization_id, experience, bio)
SELECT u.id, s.id, 8,
       'Специалист в области неврологии.'
FROM users u, specializations s
WHERE u.email='doctor2@demo.local' AND s.name='Невролог'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO doctors (user_id, specialization_id, experience, bio)
SELECT u.id, s.id, 15,
       'Терапевт. Первичный приём, направление к профильным специалистам.'
FROM users u, specializations s
WHERE u.email='doctor3@demo.local' AND s.name='Терапевт'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO slots (doctor_id, started_at, ended_at)
SELECT
  d.id,
  gs,
  gs + INTERVAL '30 minutes'
FROM doctors d
CROSS JOIN generate_series(
  date_trunc('day', NOW() + INTERVAL '1 day') + TIME '08:00',
  date_trunc('day', NOW() + INTERVAL '1 day') + TIME '16:00',
  INTERVAL '30 minutes'
) AS gs
WHERE EXTRACT(DOW FROM gs) BETWEEN 1 AND 5

UNION ALL

SELECT
  d.id,
  gs,
  gs + INTERVAL '30 minutes'
FROM doctors d
CROSS JOIN generate_series(
  date_trunc('day', NOW() + INTERVAL '2 day') + TIME '08:00',
  date_trunc('day', NOW() + INTERVAL '2 day') + TIME '16:00',
  INTERVAL '30 minutes'
) AS gs
WHERE EXTRACT(DOW FROM gs) BETWEEN 1 AND 5

UNION ALL

SELECT
  d.id,
  gs,
  gs + INTERVAL '30 minutes'
FROM doctors d
CROSS JOIN generate_series(
  date_trunc('day', NOW() + INTERVAL '3 day') + TIME '08:00',
  date_trunc('day', NOW() + INTERVAL '3 day') + TIME '16:00',
  INTERVAL '30 minutes'
) AS gs
WHERE EXTRACT(DOW FROM gs) BETWEEN 1 AND 5;
