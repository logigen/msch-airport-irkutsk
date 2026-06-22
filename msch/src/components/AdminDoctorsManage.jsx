import { useEffect, useState } from 'react';
import api from '../api';
import { colors } from '../theme';

const inputStyle = {
  width: '100%', padding: '9px 14px', border: `1px solid ${colors.lightBlue}`,
  borderRadius: 10, fontSize: 13, color: colors.text, background: '#fff',
  boxSizing: 'border-box', marginBottom: 12,
};
const labelStyle = { fontSize: 12, fontWeight: 600, color: colors.textMuted, display: 'block', marginBottom: 5 };
const btnPrimary = {
  padding: '9px 20px', fontSize: 13, border: 'none', borderRadius: 20,
  background: colors.accent, color: '#fff', cursor: 'pointer', fontWeight: 600,
};
const btnSm = (color, border) => ({
  fontSize: 11, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
  border: `1px solid ${border}`, background: '#fff', color, marginRight: 6,
});
const cardStyle = {
  border: `1px solid ${colors.lightBluePale}`, borderRadius: 14,
  padding: 20, background: '#fafcff', marginBottom: 16,
};
const formatDateInput = (date) => date.toISOString().slice(0, 10);

const AdminDoctorsManage = ({ users, doctors, onRefresh, setError }) => {
  const [tab, setTab] = useState('list');
  const [specializations, setSpecializations] = useState([]);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newSpec, setNewSpec] = useState('');
  const [doctorForm, setDoctorForm] = useState({
    mode: 'new',
    user_id: '',
    full_name: '',
    email: '',
    password: '',
    specialization_id: '',
    experience: '',
    bio: '',
    work_start: '08:00',
    work_end: '16:00',
  });
  const [editForm, setEditForm] = useState({ specialization_id: '', experience: '', bio: '', work_start: '08:00', work_end: '16:00' });
  const [scheduleDoctorId, setScheduleDoctorId] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    from_time: '08:00',
    to_time: '16:00',
    duration_minutes: 30,
  });
  const [singleSlot, setSingleSlot] = useState({ date: '', time: '10:00', duration: 30 });
  const todayInput = formatDateInput(new Date());
  const maxBookingInput = formatDateInput(new Date(Date.now() + 6 * 24 * 60 * 60000));

  useEffect(() => { loadSpecs(); }, []);

  useEffect(() => {
    if (scheduleDoctorId) {
      const selected = doctors.find(d => String(d.id) === String(scheduleDoctorId));
      if (selected) {
        setScheduleForm(f => ({
          ...f,
          from_time: selected.work_start || '08:00',
          to_time: selected.work_end || '16:00',
          duration_minutes: 30,
        }));
      }
      loadSlots(scheduleDoctorId);
    }
  }, [scheduleDoctorId]);

  const loadSpecs = async () => {
    try {
      const { data } = await api.get('/specializations');
      setSpecializations(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Не удалось загрузить специализации');
    }
  };

  const loadSlots = async (doctorId) => {
    setLoading(true);
    try {
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 7);
      const { data } = await api.get('/slots', {
        params: { doctor_id: doctorId, date_from: from.toISOString(), date_to: to.toISOString() },
      });
      setSlots(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Не удалось загрузить расписание');
    } finally {
      setLoading(false);
    }
  };

  const addSpecialization = async (e) => {
    e.preventDefault();
    if (!newSpec.trim()) return;
    try {
      const { data } = await api.post('/specializations', { name: newSpec.trim() });
      setSpecializations(s => [...s, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewSpec('');
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Не удалось добавить специализацию');
    }
  };

  const deleteSpecialization = async (id) => {
    if (!confirm('Удалить специализацию?')) return;
    try {
      await api.delete(`/specializations/${id}`);
      setSpecializations(s => s.filter(x => x.id !== id));
    } catch (e) {
      setError(e.response?.data?.message || 'Не удалось удалить');
    }
  };

  const createDoctor = async (e) => {
    e.preventDefault();
    try {
      const body = doctorForm.mode === 'existing'
        ? {
            user_id: Number(doctorForm.user_id),
            specialization_id: Number(doctorForm.specialization_id),
            experience: Number(doctorForm.experience),
            bio: doctorForm.bio,
            work_start: doctorForm.work_start,
            work_end: doctorForm.work_end,
          }
        : {
            full_name: doctorForm.full_name,
            email: doctorForm.email,
            password: doctorForm.password,
            specialization_id: Number(doctorForm.specialization_id),
            experience: Number(doctorForm.experience),
            bio: doctorForm.bio,
            work_start: doctorForm.work_start,
            work_end: doctorForm.work_end,
          };
      await api.post('/doctors', body);
      setDoctorForm({ mode: 'new', user_id: '', full_name: '', email: '', password: '', specialization_id: '', experience: '', bio: '', work_start: '08:00', work_end: '16:00' });
      setTab('list');
      onRefresh();
      setError('');
      alert('Врач добавлен');
    } catch (e) {
      setError(e.response?.data?.message || 'Не удалось добавить врача');
    }
  };

  const startEdit = (doctor) => {
    setEditingDoctor(doctor);
    setEditForm({
      specialization_id: String(doctor.specialization_id),
      experience: String(doctor.experience),
      bio: doctor.bio || '',
      work_start: doctor.work_start || '08:00',
      work_end: doctor.work_end || '16:00',
    });
    setTab('edit');
  };

  const saveDoctor = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/doctors/${editingDoctor.id}`, {
        specialization_id: Number(editForm.specialization_id),
        experience: Number(editForm.experience),
        bio: editForm.bio,
        work_start: editForm.work_start,
        work_end: editForm.work_end,
      });
      setEditingDoctor(null);
      setTab('list');
      onRefresh();
      setError('');
      alert('Данные врача сохранены');
    } catch (e) {
      setError(e.response?.data?.message || 'Не удалось сохранить');
    }
  };

  const deleteDoctor = async (id) => {
    if (!confirm('Удалить профиль врача? Слоты и записи будут удалены.')) return;
    try {
      await api.delete(`/doctors/${id}`);
      onRefresh();
    } catch (e) {
      setError(e.response?.data?.message || 'Не удалось удалить врача');
    }
  };

  const createBulkSlots = async (e) => {
    e.preventDefault();
    if (!scheduleDoctorId) return setError('Выберите врача');
    try {
      const { data } = await api.post('/slots/bulk', {
        doctor_id: Number(scheduleDoctorId),
        date: scheduleForm.date,
        from_time: scheduleForm.from_time,
        to_time: scheduleForm.to_time,
        duration_minutes: Number(scheduleForm.duration_minutes),
      });
      setSlots(prev => [...prev, ...data].sort((a, b) => new Date(a.started_at) - new Date(b.started_at)));
      setError('');
      alert(`Создано слотов: ${data.length}`);
    } catch (e) {
      setError(e.response?.data?.message || 'Не удалось создать расписание');
    }
  };

  const createSingleSlot = async (e) => {
    e.preventDefault();
    if (!scheduleDoctorId) return setError('Выберите врача');
    const started = new Date(`${singleSlot.date}T${singleSlot.time}:00`);
    const ended = new Date(started.getTime() + Number(singleSlot.duration) * 60000);
    try {
      const { data } = await api.post('/slots', {
        doctor_id: Number(scheduleDoctorId),
        started_at: started.toISOString(),
        ended_at: ended.toISOString(),
      });
      setSlots(prev => [...prev, data].sort((a, b) => new Date(a.started_at) - new Date(b.started_at)));
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Не удалось добавить слот');
    }
  };

  const deleteSlot = async (id) => {
    if (!confirm('Удалить слот?')) return;
    try {
      await api.delete(`/slots/${id}`);
      setSlots(s => s.filter(x => x.id !== id));
    } catch (e) {
      setError(e.response?.data?.message || 'Не удалось удалить слот');
    }
  };

  const doctorsWithoutProfile = users.filter(
    u => u.role === 'doctor' && !doctors.some(d => d.user?.id === u.id)
  );

  const tabs = [
    ['list', 'Список врачей'],
    ['add', '+ Добавить врача'],
    ['specs', 'Специализации'],
    ['schedule', 'Расписание'],
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setError(''); }}
            style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer', fontWeight: tab === key ? 600 : 400,
              border: `1px solid ${tab === key ? colors.accent : colors.lightBlue}`,
              background: tab === key ? colors.accent : '#fff',
              color: tab === key ? '#fff' : colors.textMuted,
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Список врачей */}
      {tab === 'list' && (
        <div>
          {doctors.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', color: colors.textMuted }}>
              Врачей пока нет. Добавьте специализацию и создайте первого врача.
            </div>
          ) : doctors.map(d => (
            <div key={d.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>{d.user?.full_name}</div>
                <div style={{ fontSize: 13, color: colors.accent, marginTop: 2 }}>{d.specialization?.name} · стаж {d.experience} лет</div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 5 }}>Рабочее время: {d.work_start || '08:00'} — {d.work_end || '16:00'}, приём 30 минут</div>
                {d.bio && <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 6, maxWidth: 500 }}>{d.bio}</div>}
              </div>
              <div>
                <button onClick={() => startEdit(d)} style={btnSm(colors.accent, colors.lightBlue)}>Редактировать</button>
                <button onClick={() => { setScheduleDoctorId(String(d.id)); setTab('schedule'); }} style={btnSm(colors.accent, colors.lightBlue)}>Расписание</button>
                <button onClick={() => deleteDoctor(d.id)} style={btnSm('#c0392b', '#f5c6c6')}>Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Добавить врача */}
      {tab === 'add' && (
        <form onSubmit={createDoctor} style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 16 }}>Новый врач</div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {[['new', 'Создать аккаунт'], ['existing', 'Из пользователей']].map(([mode, label]) => (
              <button key={mode} type="button" onClick={() => setDoctorForm(f => ({ ...f, mode }))}
                style={{
                  padding: '8px 16px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  border: `1px solid ${doctorForm.mode === mode ? colors.accent : colors.lightBlue}`,
                  background: doctorForm.mode === mode ? colors.lightBluePale : '#fff',
                  color: doctorForm.mode === mode ? colors.accentDark : colors.textMuted,
                }}>
                {label}
              </button>
            ))}
          </div>

          {doctorForm.mode === 'existing' ? (
            <>
              <label style={labelStyle}>Пользователь с ролью «врач»</label>
              <select style={inputStyle} value={doctorForm.user_id} onChange={e => setDoctorForm(f => ({ ...f, user_id: e.target.value }))} required>
                <option value="">— Выберите —</option>
                {doctorsWithoutProfile.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                ))}
              </select>
              {doctorsWithoutProfile.length === 0 && (
                <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12 }}>
                  Нет пользователей без профиля. Создайте нового врача или назначьте роль «врач» в разделе «Пользователи».
                </div>
              )}
            </>
          ) : (
            <>
              <label style={labelStyle}>ФИО</label>
              <input style={inputStyle} value={doctorForm.full_name} onChange={e => setDoctorForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Иванов Иван Иванович" required />
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={doctorForm.email} onChange={e => setDoctorForm(f => ({ ...f, email: e.target.value }))} placeholder="doctor@mail.ru" required />
              <label style={labelStyle}>Пароль</label>
              <input style={inputStyle} type="password" value={doctorForm.password} onChange={e => setDoctorForm(f => ({ ...f, password: e.target.value }))} placeholder="Минимум 8 символов" required minLength={8} />
            </>
          )}

          <label style={labelStyle}>Специализация</label>
          <select style={inputStyle} value={doctorForm.specialization_id} onChange={e => setDoctorForm(f => ({ ...f, specialization_id: e.target.value }))} required>
            <option value="">— Выберите —</option>
            {specializations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <label style={labelStyle}>Стаж (лет)</label>
          <input style={inputStyle} type="number" min={0} value={doctorForm.experience} onChange={e => setDoctorForm(f => ({ ...f, experience: e.target.value }))} required />

          <label style={labelStyle}>О враче (биография)</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={doctorForm.bio} onChange={e => setDoctorForm(f => ({ ...f, bio: e.target.value }))} placeholder="Образование, опыт, направления работы..." />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            <div>
              <label style={labelStyle}>Работает с</label>
              <input style={inputStyle} type="time" value={doctorForm.work_start} onChange={e => setDoctorForm(f => ({ ...f, work_start: e.target.value }))} required />
            </div>
            <div>
              <label style={labelStyle}>Работает до</label>
              <input style={inputStyle} type="time" value={doctorForm.work_end} onChange={e => setDoctorForm(f => ({ ...f, work_end: e.target.value }))} required />
            </div>
          </div>

          <button type="submit" style={btnPrimary}>Добавить врача</button>
        </form>
      )}

      {/* Редактирование */}
      {tab === 'edit' && editingDoctor && (
        <form onSubmit={saveDoctor} style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 4 }}>{editingDoctor.user?.full_name}</div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 16 }}>{editingDoctor.user?.email}</div>

          <label style={labelStyle}>Специализация</label>
          <select style={inputStyle} value={editForm.specialization_id} onChange={e => setEditForm(f => ({ ...f, specialization_id: e.target.value }))} required>
            {specializations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <label style={labelStyle}>Стаж (лет)</label>
          <input style={inputStyle} type="number" min={0} value={editForm.experience} onChange={e => setEditForm(f => ({ ...f, experience: e.target.value }))} required />

          <label style={labelStyle}>О враче (биография)</label>
          <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            <div>
              <label style={labelStyle}>Работает с</label>
              <input style={inputStyle} type="time" value={editForm.work_start} onChange={e => setEditForm(f => ({ ...f, work_start: e.target.value }))} required />
            </div>
            <div>
              <label style={labelStyle}>Работает до</label>
              <input style={inputStyle} type="time" value={editForm.work_end} onChange={e => setEditForm(f => ({ ...f, work_end: e.target.value }))} required />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" style={btnPrimary}>Сохранить</button>
            <button type="button" onClick={() => { setTab('list'); setEditingDoctor(null); }}
              style={{ ...btnPrimary, background: '#fff', color: colors.textMuted, border: `1px solid ${colors.lightBlue}` }}>
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Специализации */}
      {tab === 'specs' && (
        <div>
          <form onSubmit={addSpecialization} style={{ ...cardStyle, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Новая специализация</label>
              <input style={{ ...inputStyle, marginBottom: 0 }} value={newSpec} onChange={e => setNewSpec(e.target.value)} placeholder="Например: Кардиолог" />
            </div>
            <button type="submit" style={{ ...btnPrimary, marginBottom: 0 }}>Добавить</button>
          </form>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {specializations.map(s => (
              <div key={s.id} style={{ ...cardStyle, marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{s.name}</span>
                <button onClick={() => deleteSpecialization(s.id)} style={btnSm('#c0392b', '#f5c6c6')}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Расписание */}
      {tab === 'schedule' && (
        <div>
          <div style={cardStyle}>
            <label style={labelStyle}>Врач</label>
            <select style={inputStyle} value={scheduleDoctorId} onChange={e => setScheduleDoctorId(e.target.value)}>
              <option value="">— Выберите врача —</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.user?.full_name} — {d.specialization?.name}</option>)}
            </select>
          </div>

          {scheduleDoctorId && (
            <>
              <form onSubmit={createBulkSlots} style={cardStyle}>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 14 }}>Создать расписание на день</div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12 }}>
                  По умолчанию подставляется рабочее время выбранного врача. Медсанчасть работает до 16:00 в будни и до 14:00 в субботу; запись открыта на 7 дней вперёд.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Дата</label>
                    <input style={inputStyle} type="date" min={todayInput} max={maxBookingInput} value={scheduleForm.date} onChange={e => setScheduleForm(f => ({ ...f, date: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={labelStyle}>С</label>
                    <input style={inputStyle} type="time" value={scheduleForm.from_time} onChange={e => setScheduleForm(f => ({ ...f, from_time: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={labelStyle}>До</label>
                    <input style={inputStyle} type="time" value={scheduleForm.to_time} onChange={e => setScheduleForm(f => ({ ...f, to_time: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Интервал (мин)</label>
                    <input style={inputStyle} type="number" min={10} max={180} step={5} value={scheduleForm.duration_minutes} onChange={e => setScheduleForm(f => ({ ...f, duration_minutes: e.target.value }))} required />
                  </div>
                </div>
                <button type="submit" style={btnPrimary}>Создать слоты на день</button>
              </form>

              <form onSubmit={createSingleSlot} style={cardStyle}>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 14 }}>Добавить один слот</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Дата</label>
                    <input style={inputStyle} type="date" min={todayInput} max={maxBookingInput} value={singleSlot.date} onChange={e => setSingleSlot(f => ({ ...f, date: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Время</label>
                    <input style={inputStyle} type="time" value={singleSlot.time} onChange={e => setSingleSlot(f => ({ ...f, time: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Длительность (мин)</label>
                    <input style={inputStyle} type="number" min={10} max={180} value={singleSlot.duration} onChange={e => setSingleSlot(f => ({ ...f, duration: e.target.value }))} required />
                  </div>
                </div>
                <button type="submit" style={btnPrimary}>Добавить слот</button>
              </form>

              <div style={cardStyle}>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 14 }}>
                  Слоты на ближайшие 7 дней ({slots.length})
                </div>
                {loading ? (
                  <div style={{ color: colors.textMuted, fontSize: 13 }}>Загрузка...</div>
                ) : slots.length === 0 ? (
                  <div style={{ color: colors.textMuted, fontSize: 13 }}>Слотов нет. Создайте расписание выше.</div>
                ) : (
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {slots.map(s => {
                      const start = new Date(s.started_at);
                      const busy = !s.is_available;
                      return (
                        <div key={s.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '8px 0', borderBottom: `1px solid ${colors.lightBluePale}`, fontSize: 13,
                        }}>
                          <span style={{ color: colors.text }}>
                            {start.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {' '}
                            {start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            {' — '}
                            {new Date(s.ended_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 600,
                              background: busy ? '#fff0f0' : colors.lightBluePale,
                              color: busy ? '#c0392b' : colors.accent,
                            }}>
                              {busy ? 'Занят' : 'Свободен'}
                            </span>
                            {!busy && (
                              <button onClick={() => deleteSlot(s.id)} style={btnSm('#c0392b', '#f5c6c6')}>Удалить</button>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDoctorsManage;
