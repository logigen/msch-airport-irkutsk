import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import useAuthStore from '../store/authStore';

const Cabinet = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [section, setSection] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [tab, setTab] = useState('active');
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || '', email: user?.email || '', password: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/appointments/my').then(r => setAppointments(r.data));
  }, []);

  const cancel = async (id) => {
    if (!confirm('Отменить запись? Это время снова станет доступно для записи.')) return;
    try {
      await api.delete(`/appointments/${id}`);
      const { data } = await api.get('/appointments/my');
      setAppointments(data);
    } catch (e) {
      alert(e.response?.data?.message || 'Не удалось отменить запись');
    }
  };

  const filtered = appointments.filter(a =>
    tab === 'active' ? a.status === 'active' : tab === 'completed' ? a.status === 'completed' : a.status === 'cancelled'
  );

  const saveProfile = async (e) => {
    e.preventDefault();
    await api.put('/users/me', profileForm);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const menuItem = (key, label) => (
    <div onClick={() => setSection(key)}
      style={{ padding: '10px 20px', fontSize: 13, cursor: 'pointer', color: section === key ? '#1a4a8a' : '#555', fontWeight: section === key ? 600 : 400, borderLeft: section === key ? '3px solid #1a4a8a' : '3px solid transparent', background: section === key ? '#f0f5ff' : 'transparent' }}>
      {label}
    </div>
  );

  return (
    <div style={{ background: '#f2f4f7', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid #e0e4ea', borderRadius: 2, display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 600 }}>
          {/* Сайдбар */}
          <div style={{ borderRight: '1px solid #eee', padding: '24px 0' }}>
            <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #eee', marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 2, background: '#e8f0fb', color: '#1a4a8a', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                {user?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a3a' }}>{user?.full_name}</div>
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{user?.email}</div>
            </div>
            {menuItem('appointments', 'Мои записи')}
            {menuItem('profile', 'Профиль')}
            <div onClick={() => { logout(); navigate('/'); }}
              style={{ padding: '10px 20px', fontSize: 13, color: '#aaa', cursor: 'pointer', marginTop: 8 }}>
              Выйти
            </div>
          </div>

          {/* Контент */}
          <div style={{ padding: '32px 36px' }}>
            {section === 'appointments' && (
              <>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2a3a', marginBottom: 4 }}>Мои записи</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Управляйте своими записями к врачам</div>
                <div style={{ display: 'flex', borderBottom: '1px solid #e0e4ea', marginBottom: 20 }}>
                  {[['active', 'Предстоящие'], ['completed', 'Прошедшие'], ['cancelled', 'Отменённые']].map(([key, label]) => (
                    <div key={key} onClick={() => setTab(key)}
                      style={{ padding: '10px 20px', fontSize: 13, cursor: 'pointer', fontWeight: tab === key ? 600 : 500, color: tab === key ? '#1a4a8a' : '#888', borderBottom: tab === key ? '2px solid #1a4a8a' : '2px solid transparent', marginBottom: -1 }}>
                      {label}
                    </div>
                  ))}
                </div>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Записи</div>
                    <div style={{ marginBottom: 16 }}>Записей нет</div>
                    <button onClick={() => navigate('/doctors')} style={{ padding: '10px 24px', background: '#1a4a8a', color: '#fff', border: 'none', borderRadius: 2, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Записаться к врачу</button>
                  </div>
                ) : filtered.map(ap => {
                  const slot = ap.slot;
                  const doc = slot?.doctor;
                  const started = new Date(slot?.started_at);
                  return (
                    <div key={ap.id} style={{ border: '1px solid #e0e4ea', borderRadius: 2, padding: '18px 20px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ textAlign: 'center', minWidth: 52, background: '#f0f5ff', borderRadius: 2, padding: '8px 4px' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#1a4a8a', lineHeight: 1 }}>{started.getDate()}</div>
                        <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>{started.toLocaleDateString('ru-RU', { month: 'short' })}</div>
                        <div style={{ fontSize: 11, color: '#aaa' }}>{started.toLocaleDateString('ru-RU', { weekday: 'short' })}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a3a' }}>{doc?.user?.full_name}</div>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{doc?.specialization?.name}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>Время: {started.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 2, fontWeight: 600, background: ap.status === 'active' ? '#e8f0fb' : ap.status === 'cancelled' ? '#fff0f0' : '#f5f5f5', color: ap.status === 'active' ? '#1a4a8a' : ap.status === 'cancelled' ? '#c0392b' : '#aaa' }}>
                          {ap.status === 'active' ? 'Подтверждена' : ap.status === 'cancelled' ? 'Отменена' : 'Завершена'}
                        </span>
                        {ap.status === 'active' && (
                          <button onClick={() => cancel(ap.id)} style={{ fontSize: 12, color: '#aaa', border: '1px solid #e0e4ea', background: '#fff', borderRadius: 2, padding: '5px 12px', cursor: 'pointer' }}>Отменить</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {section === 'profile' && (
              <>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2a3a', marginBottom: 4 }}>Профиль</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Редактируйте личные данные</div>
                <form onSubmit={saveProfile} style={{ maxWidth: 480 }}>
                  {[['Полное имя', 'full_name', 'text'], ['Email', 'email', 'email']].map(([label, key, type]) => (
                    <div key={key}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>{label}</label>
                      <input type={type} value={profileForm[key]}
                        onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #d0d5e0', borderRadius: 2, fontSize: 13, marginBottom: 16, boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>Новый пароль</label>
                  <input type="password" value={profileForm.password}
                    placeholder="Оставьте пустым, чтобы не менять"
                    onChange={e => setProfileForm(f => ({ ...f, password: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${profileForm.password && profileForm.password.length < 8 ? '#c0392b' : '#d0d5e0'}`, borderRadius: 2, fontSize: 13, marginBottom: profileForm.password && profileForm.password.length < 8 ? 4 : 16, boxSizing: 'border-box' }} />
                  {profileForm.password && profileForm.password.length < 8 && (
                    <div style={{ fontSize: 12, color: '#c0392b', marginBottom: 16 }}>Минимум 8 символов</div>
                  )}
                  <button type="submit"
                    disabled={!!(profileForm.password && profileForm.password.length < 8)}
                    style={{ padding: '10px 28px', background: profileForm.password && profileForm.password.length < 8 ? '#aaa' : '#1a4a8a', color: '#fff', border: 'none', borderRadius: 2, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {saved ? 'Сохранено' : 'Сохранить изменения'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cabinet;
