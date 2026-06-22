require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { ensureSettings } = require('./db/settings');
const { ensureGallery } = require('./db/gallery');
const { ensureAppointmentsSync } = require('./db/appointments');
const { ensureMedicalHistory } = require('./db/medicalHistory');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/doctors',      require('./routes/doctors'));
app.use('/api/specializations', require('./routes/specializations'));
app.use('/api/slots',        require('./routes/slots'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/medical-history', require('./routes/medicalHistory'));
app.use('/api/settings',     require('./routes/settings'));
app.use('/api/gallery',      require('./routes/gallery'));

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;

Promise.all([ensureSettings(), ensureGallery(), ensureAppointmentsSync(), ensureMedicalHistory()])
  .then(() => {
    app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialize application settings', err);
    process.exit(1);
  });
