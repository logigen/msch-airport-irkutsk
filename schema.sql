
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Пользователи
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(150)        NOT NULL,
    email         VARCHAR(255)        NOT NULL UNIQUE,
    password_hash TEXT                NOT NULL,
    role          user_role           NOT NULL DEFAULT 'patient',
    date_created  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email  ON users (email);
CREATE INDEX idx_users_role   ON users (role);

-- 2. Refresh-токены (JWT)

CREATE TABLE refresh_tokens (
    id         SERIAL PRIMARY KEY,
    user_id    INT         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token      TEXT        NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_exp  ON refresh_tokens (expires_at);

-- 3. Специализации врачей

CREATE TABLE specializations (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE
);

-- 4. Профили врачей

CREATE TABLE doctors (
    id                SERIAL PRIMARY KEY,
    user_id           INT          NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    specialization_id INT          NOT NULL REFERENCES specializations (id),
    experience        SMALLINT     NOT NULL CHECK (experience >= 0),  -- лет стажа
    bio               TEXT,
    work_start        TIME         NOT NULL DEFAULT TIME '08:00',
    work_end          TIME         NOT NULL DEFAULT TIME '16:00',
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doctors_specialization ON doctors (specialization_id);

-- 5. Слоты расписания врача

CREATE TABLE slots (
    id           SERIAL PRIMARY KEY,
    doctor_id    INT         NOT NULL REFERENCES doctors (id) ON DELETE CASCADE,
    started_at   TIMESTAMPTZ NOT NULL,
    ended_at     TIMESTAMPTZ NOT NULL,
    is_available BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_slot_times CHECK (ended_at > started_at)
);

CREATE INDEX idx_slots_doctor      ON slots (doctor_id);
CREATE INDEX idx_slots_started_at  ON slots (started_at);
CREATE INDEX idx_slots_avail       ON slots (doctor_id, started_at) WHERE is_available = TRUE;

-- 6. Записи на приём

CREATE TYPE appointment_status AS ENUM ('active', 'cancelled', 'completed');

CREATE TABLE appointments (
    id         SERIAL PRIMARY KEY,
    patient_id INT                NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    slot_id    INT                NOT NULL REFERENCES slots (id),
    status     appointment_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_patient ON appointments (patient_id);
CREATE INDEX idx_appointments_status  ON appointments (status);
CREATE UNIQUE INDEX idx_appointments_slot_busy ON appointments (slot_id) WHERE status IN ('active', 'completed');

-- 7. Истории болезни пациентов (доступ только для врачей на уровне API)

CREATE TABLE patient_medical_histories (
    patient_id      INT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    complaints      TEXT        NOT NULL DEFAULT '',
    anamnesis       TEXT        NOT NULL DEFAULT '',
    diagnosis       TEXT        NOT NULL DEFAULT '',
    treatment       TEXT        NOT NULL DEFAULT '',
    recommendations TEXT        NOT NULL DEFAULT '',
    notes           TEXT        NOT NULL DEFAULT '',
    updated_by      INT         REFERENCES users (id) ON DELETE SET NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patient_medical_histories_updated_at
    ON patient_medical_histories (updated_at);

-- 8. Настройки приложения

CREATE TABLE app_settings (
    key        TEXT PRIMARY KEY,
    value      TEXT        NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Автоматически помечаем слот как занятый при создании записи
CREATE OR REPLACE FUNCTION trg_slot_mark_busy()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE slots SET is_available = FALSE WHERE id = NEW.slot_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER after_appointment_insert
AFTER INSERT ON appointments
FOR EACH ROW EXECUTE FUNCTION trg_slot_mark_busy();

-- При отмене — освобождаем слот обратно
CREATE OR REPLACE FUNCTION trg_slot_free_on_cancel()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status IN ('cancelled') AND OLD.status = 'active' THEN
        UPDATE slots SET is_available = TRUE WHERE id = NEW.slot_id;
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER after_appointment_status_change
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION trg_slot_free_on_cancel();

-- 9. Автообновление updated_at

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 10. Лента фотографий (главная страница)

CREATE TABLE gallery_photos (
    id         SERIAL PRIMARY KEY,
    image      TEXT        NOT NULL,
    caption    VARCHAR(255),
    sort_order INT         NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Базовые справочники

INSERT INTO specializations (name) VALUES
    ('Терапевт'),
    ('Кардиолог'),
    ('Хирург'),
    ('Офтальмолог'),
    ('Невролог'),
    ('Стоматолог'),
    ('Дерматолог'),
    ('Педиатр');
