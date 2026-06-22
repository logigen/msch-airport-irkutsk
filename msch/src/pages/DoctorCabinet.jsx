import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import useAuthStore from '../store/authStore';

const clinicDateKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const statusText = {
  active: 'Активна',
  cancelled: 'Отменена',
  completed: 'Завершена',
};

const emptyHistoryForm = {
  complaints: '',
  anamnesis: '',
  diagnosis: '',
  treatment: '',
  recommendations: '',
  notes: '',
};

const historyFields = [
  ['complaints', 'Жалобы'],
  ['anamnesis', 'Анамнез'],
  ['diagnosis', 'Диагноз'],
  ['treatment', 'Лечение'],
  ['recommendations', 'Рекомендации'],
  ['notes', 'Заметки врача'],
];

const DoctorCabinet = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [section, setSection] = useState('today');
  const [form, setForm] = useState({ patient_id: '', date: clinicDateKey(), slot_id: '' });
  const [historyPatientId, setHistoryPatientId] = useState('');
  const [historyPatient, setHistoryPatient] = useState(null);
  const [historyForm, setHistoryForm] = useState(emptyHistoryForm);
  const [historyMeta, setHistoryMeta] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySaving, setHistorySaving] = useState(false);
  const [historyMessage, setHistoryMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadAppointments = async () => {
    const { data } = await api.get('/appointments/doctor');
    setAppointments(data);
  };

  useEffect(() => {
    Promise.all([
      api.get('/doctors/me'),
      api.get('/users/patients'),
      api.get('/appointments/doctor'),
    ])
      .then(([doctorRes, patientsRes, appointmentsRes]) => {
        setDoctor(doctorRes.data);
        setPatients(patientsRes.data);
        setAppointments(appointmentsRes.data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!doctor?.id || !form.date) return;

    api.get('/slots', {
      params: {
        doctor_id: doctor.id,
        date_from: `${form.date}T00:00:00+08:00`,
        date_to: `${form.date}T23:59:59+08:00`,
      },
    })
      .then(({ data }) => {
        const now = new Date();
        const free = data.filter(slot => slot.is_available && new Date(slot.started_at) > now);
        setSlots(free);
        setForm(current => ({ ...current, slot_id: free.some(slot => String(slot.id) === String(current.slot_id)) ? current.slot_id : '' }));
      })
      .catch(console.error);
  }, [doctor?.id, form.date]);

  const today = new Date();
  const todayAppts = appointments.filter(a => {
    const d = new Date(a.slot?.started_at);
    return d.toDateString() === today.toDateString() && a.status === 'active';
  });
  const upcomingAppts = appointments.filter(a => {
    const d = new Date(a.slot?.started_at);
    return d > today && a.status === 'active';
  });

  const list = section === 'today' ? todayAppts : section === 'upcoming' ? upcomingAppts : appointments;
  const activeSlots = useMemo(() => slots.filter(slot => slot.is_available), [slots]);

  const loadMedicalHistory = async (patientId) => {
    if (!patientId) {
      setHistoryPatient(null);
      setHistoryForm(emptyHistoryForm);
      setHistoryMeta(null);
      setHistoryMessage('');
      return;
    }

    setHistoryLoading(true);
    setHistoryMessage('');
    try {
      const { data } = await api.get(`/medical-history/${patientId}`);
      setHistoryPatient(data.patient);
      setHistoryForm({
        complaints: data.history?.complaints || '',
        anamnesis: data.history?.anamnesis || '',
        diagnosis: data.history?.diagnosis || '',
        treatment: data.history?.treatment || '',
        recommendations: data.history?.recommendations || '',
        notes: data.history?.notes || '',
      });
      setHistoryMeta({
        updated_at: data.history?.updated_at,
        updated_by_name: data.history?.updated_by_name,
      });
    } catch (err) {
      setHistoryMessage(err.response?.data?.message || 'Не удалось загрузить историю болезни');
    } finally {
      setHistoryLoading(false);
    }
  };

  const selectHistoryPatient = (patientId) => {
    setHistoryPatientId(patientId);
    loadMedicalHistory(patientId);
  };

  const openHistoryFromAppointment = (patientId) => {
    setSection('history');
    selectHistoryPatient(String(patientId));
  };

  const createAppointment = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.slot_id) {
      setMessage('Выберите пациента и время приема');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await api.post('/appointments/doctor', {
        patient_id: Number(form.patient_id),
        slot_id: Number(form.slot_id),
      });
      setMessage('Запись добавлена');
      setForm(current => ({ ...current, patient_id: '', slot_id: '' }));
      await loadAppointments();
      const { data } = await api.get('/slots', {
        params: {
          doctor_id: doctor.id,
          date_from: `${form.date}T00:00:00+08:00`,
          date_to: `${form.date}T23:59:59+08:00`,
        },
      });
      setSlots(data.filter(slot => slot.is_available && new Date(slot.started_at) > new Date()));
    } catch (err) {
      setMessage(err.response?.data?.message || 'Не удалось добавить запись');
    } finally {
      setLoading(false);
    }
  };

  const completeAppointment = async (id) => {
    if (!confirm('Закрыть прием пациента? Запись будет отмечена как завершенная.')) return;
    try {
      await api.patch(`/appointments/${id}/complete`);
      await loadAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Не удалось закрыть прием');
    }
  };

  const saveMedicalHistory = async (e) => {
    e.preventDefault();
    if (!historyPatientId) {
      setHistoryMessage('Выберите пациента');
      return;
    }

    setHistorySaving(true);
    setHistoryMessage('');
    try {
      const { data } = await api.put(`/medical-history/${historyPatientId}`, historyForm);
      setHistoryMeta({
        updated_at: data.history?.updated_at,
        updated_by_name: user?.full_name,
      });
      setHistoryMessage('История болезни сохранена');
    } catch (err) {
      setHistoryMessage(err.response?.data?.message || 'Не удалось сохранить историю болезни');
    } finally {
      setHistorySaving(false);
    }
  };

  const menuItem = (key, label, count) => (
    <div onClick={() => setSection(key)}
      style={{ padding: '10px 20px', fontSize: 13, cursor: 'pointer', color: section === key ? '#1a4a8a' : '#555', fontWeight: section === key ? 600 : 400, borderLeft: section === key ? '3px solid #1a4a8a' : '3px solid transparent', background: section === key ? '#f0f5ff' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {label}
      {count !== undefined && <span style={{ fontSize: 11, background: section === key ? '#1a4a8a' : '#e8e8e8', color: section === key ? '#fff' : '#888', borderRadius: 10, padding: '1px 7px', fontWeight: 600 }}>{count}</span>}
    </div>
  );

  const fieldStyle = { width: '100%', padding: '10px 12px', border: '1px solid #d0d5e0', borderRadius: 2, fontSize: 13, boxSizing: 'border-box', background: '#fff' };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: '#555', display: 'block', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 };

  return (
    <div style={{ background: '#f2f4f7', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid #e0e4ea', borderRadius: 2, display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 600 }}>
          <div style={{ borderRight: '1px solid #eee', padding: '24px 0' }}>
            <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #eee', marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 2, background: '#e8f0fb', color: '#1a4a8a', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                {user?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a3a' }}>{user?.full_name}</div>
              <div style={{ fontSize: 11, color: '#1a4a8a', marginTop: 3, background: '#e8f0fb', display: 'inline-block', padding: '2px 8px', borderRadius: 2, fontWeight: 600 }}>Врач</div>
            </div>
            {menuItem('today', 'Сегодня', todayAppts.length)}
            {menuItem('upcoming', 'Предстоящие', upcomingAppts.length)}
            {menuItem('all', 'Все записи')}
            {menuItem('create', 'Новая запись')}
            {menuItem('history', 'Истории болезни')}
            <div onClick={() => { logout(); navigate('/'); }}
              style={{ padding: '10px 20px', fontSize: 13, color: '#aaa', cursor: 'pointer', marginTop: 16 }}>
              Выйти
            </div>
          </div>

          <div style={{ padding: '32px 36px' }}>
            {section === 'create' ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2a3a', marginBottom: 4 }}>Новая запись пациента</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Выберите пациента и свободное время в своем расписании</div>

                <form onSubmit={createAppointment} style={{ maxWidth: 560 }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Пациент</label>
                    <select value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} style={fieldStyle}>
                      <option value="">Выберите пациента</option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>{patient.full_name} · {patient.email}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Дата</label>
                    <input type="date" min={clinicDateKey()} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value, slot_id: '' }))} style={fieldStyle} />
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>Свободное время</label>
                    <select value={form.slot_id} onChange={e => setForm(f => ({ ...f, slot_id: e.target.value }))} style={fieldStyle}>
                      <option value="">{activeSlots.length ? 'Выберите время' : 'Нет свободных слотов'}</option>
                      {activeSlots.map(slot => {
                        const start = new Date(slot.started_at);
                        const end = new Date(slot.ended_at);
                        return (
                          <option key={slot.id} value={slot.id}>
                            {start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} — {end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {message && (
                    <div style={{ background: message === 'Запись добавлена' ? '#edf8f0' : '#fff0f0', border: `1px solid ${message === 'Запись добавлена' ? '#bde3c8' : '#f5c6c6'}`, color: message === 'Запись добавлена' ? '#217a3b' : '#c0392b', padding: '10px 12px', marginBottom: 16, fontSize: 13, borderRadius: 2 }}>
                      {message}
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    style={{ padding: '11px 24px', background: loading ? '#aaa' : '#1a4a8a', color: '#fff', border: 'none', borderRadius: 2, fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>
                    {loading ? 'Добавление...' : 'Добавить запись'}
                  </button>
                </form>
              </>
            ) : section === 'history' ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2a3a', marginBottom: 4 }}>История болезни пациента</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Доступна только врачам. Пациент не видит и не редактирует этот раздел.</div>

                <div style={{ maxWidth: 760 }}>
                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>Пациент</label>
                    <select value={historyPatientId} onChange={e => selectHistoryPatient(e.target.value)} style={fieldStyle}>
                      <option value="">Выберите пациента</option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>{patient.full_name} · {patient.email}</option>
                      ))}
                    </select>
                  </div>

                  {historyLoading ? (
                    <div style={{ padding: 36, textAlign: 'center', color: '#888', border: '1px solid #e0e4ea', borderRadius: 2 }}>
                      Загрузка истории болезни...
                    </div>
                  ) : historyPatient ? (
                    <form onSubmit={saveMedicalHistory}>
                      <div style={{ border: '1px solid #e0e4ea', borderRadius: 2, padding: 16, marginBottom: 18, background: '#fbfcfe' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a3a' }}>{historyPatient.full_name}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{historyPatient.email}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
                          {historyMeta?.updated_at
                            ? `Последнее обновление: ${new Date(historyMeta.updated_at).toLocaleString('ru-RU')}${historyMeta.updated_by_name ? `, ${historyMeta.updated_by_name}` : ''}`
                            : 'История болезни еще не заполнена'}
                        </div>
                      </div>

                      {historyFields.map(([key, label]) => (
                        <div key={key} style={{ marginBottom: 14 }}>
                          <label style={labelStyle}>{label}</label>
                          <textarea
                            value={historyForm[key]}
                            onChange={e => setHistoryForm(current => ({ ...current, [key]: e.target.value }))}
                            rows={key === 'notes' ? 4 : 3}
                            maxLength={5000}
                            style={{ ...fieldStyle, minHeight: key === 'notes' ? 96 : 78, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
                          />
                        </div>
                      ))}

                      {historyMessage && (
                        <div style={{ background: historyMessage === 'История болезни сохранена' ? '#edf8f0' : '#fff0f0', border: `1px solid ${historyMessage === 'История болезни сохранена' ? '#bde3c8' : '#f5c6c6'}`, color: historyMessage === 'История болезни сохранена' ? '#217a3b' : '#c0392b', padding: '10px 12px', marginBottom: 16, fontSize: 13, borderRadius: 2 }}>
                          {historyMessage}
                        </div>
                      )}

                      <button type="submit" disabled={historySaving}
                        style={{ padding: '11px 24px', background: historySaving ? '#aaa' : '#1a4a8a', color: '#fff', border: 'none', borderRadius: 2, fontSize: 13, fontWeight: 700, cursor: historySaving ? 'default' : 'pointer' }}>
                        {historySaving ? 'Сохранение...' : 'Сохранить историю'}
                      </button>
                    </form>
                  ) : (
                    <div style={{ padding: 48, textAlign: 'center', color: '#aaa', border: '1px solid #e0e4ea', borderRadius: 2 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>История</div>
                      <div>Выберите пациента для заполнения истории болезни</div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2a3a', marginBottom: 4 }}>
                  {section === 'today' ? 'Приём сегодня' : section === 'upcoming' ? 'Предстоящие записи' : 'Все записи'}
                </div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
                  {today.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>

                {list.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Расписание</div>
                    <div>Записей нет</div>
                  </div>
                ) : list.map(ap => {
                  const started = new Date(ap.slot?.started_at);
                  return (
                    <div key={ap.id} style={{ border: '1px solid #e0e4ea', borderRadius: 2, padding: '16px 20px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ textAlign: 'center', minWidth: 52, background: '#f0f5ff', borderRadius: 2, padding: '8px 4px' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a4a8a', lineHeight: 1 }}>{started.getDate()}</div>
                        <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>{started.toLocaleDateString('ru-RU', { month: 'short' })}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a3a' }}>{ap.patient?.full_name}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                          Время: {started.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                        <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 2, fontWeight: 600, background: ap.status === 'active' ? '#e8f0fb' : ap.status === 'cancelled' ? '#fff0f0' : '#f5f5f5', color: ap.status === 'active' ? '#1a4a8a' : ap.status === 'cancelled' ? '#c0392b' : '#777' }}>
                          {statusText[ap.status] || ap.status}
                        </span>
                        {ap.status === 'active' && (
                          <button onClick={() => completeAppointment(ap.id)}
                            style={{ fontSize: 12, color: '#1a4a8a', border: '1px solid #abc8ec', background: '#fff', borderRadius: 2, padding: '5px 12px', cursor: 'pointer', fontWeight: 600 }}>
                            Закрыть прием
                          </button>
                        )}
                        <button onClick={() => openHistoryFromAppointment(ap.patient?.id)}
                          style={{ fontSize: 12, color: '#0d5c36', border: '1px solid #b8d8c7', background: '#fff', borderRadius: 2, padding: '5px 12px', cursor: 'pointer', fontWeight: 600 }}>
                          История болезни
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorCabinet;
