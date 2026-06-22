import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import useAuthStore from '../store/authStore';
import { maskEmail, maskName } from '../utils/privacy';
import AdminDoctorsManage from '../components/AdminDoctorsManage';
import AdminServicesManage from '../components/AdminServicesManage';

const AdminPanel = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [section, setSection] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [logo, setLogo] = useState('');
  const [gallery, setGallery] = useState([]);
  const [services, setServices] = useState([]);
  const [savingServices, setSavingServices] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (section !== 'dashboard') loadSection(section);
  }, [section]);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    const [u, d, a, l, g, s] = await Promise.allSettled([
      api.get('/users'),
      api.get('/doctors'),
      api.get('/appointments'),
      api.get('/settings/logo'),
      api.get('/gallery'),
      api.get('/settings/services'),
    ]);

    if (u.status === 'fulfilled') setUsers(u.value.data);
    if (d.status === 'fulfilled') setDoctors(d.value.data);
    if (a.status === 'fulfilled') setAppointments(a.value.data);
    if (l.status === 'fulfilled') setLogo(l.value.data.logo);
    if (g.status === 'fulfilled') setGallery(g.value.data);
    if (s.status === 'fulfilled') setServices(s.value.data.services);

    const failed = [u, d, a].find(r => r.status === 'rejected');
    if (failed) {
      const status = failed.reason?.response?.status;
      setError(status === 403
        ? 'Нет доступа к админке. Войдите под учётной записью администратора.'
        : failed.reason?.response?.data?.message || 'Не удалось загрузить данные админки');
    }
    setLoading(false);
  };

  const loadSection = async (sec) => {
    setLoading(true);
    setError('');
    try {
      if (sec === 'users') { const r = await api.get('/users'); setUsers(r.data); }
      else if (sec === 'doctors') { const r = await api.get('/doctors'); setDoctors(r.data); }
      else if (sec === 'appointments') { const r = await api.get('/appointments'); setAppointments(r.data); }
      else if (sec === 'settings') { const r = await api.get('/settings/logo'); setLogo(r.data.logo); }
      else if (sec === 'gallery') { const r = await api.get('/gallery'); setGallery(r.data); }
      else if (sec === 'services') { const r = await api.get('/settings/services'); setServices(r.data.services); }
    } catch (e) {
      setError(e.response?.status === 403
        ? 'Нет доступа к этому разделу. Войдите под администратором.'
        : e.response?.data?.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Выберите файл изображения');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  };

  const saveLogo = async () => {
    setError('');
    try {
      const { data } = await api.put('/settings/logo', { logo });
      setLogo(data.logo);
      alert('Логотип сохранён');
    } catch (e) {
      setError(e.response?.data?.message || 'Не удалось сохранить логотип');
    }
  };

  const handleGalleryFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Выберите файл изображения');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const { data } = await api.post('/gallery', { image: reader.result, caption: '' });
        setGallery(g => [...g, data]);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Не удалось загрузить фото');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const updateGalleryCaption = async (id, caption) => {
    try {
      const { data } = await api.put(`/gallery/${id}`, { caption });
      setGallery(g => g.map(p => p.id === id ? data : p));
    } catch (e) {
      setError(e.response?.data?.message || 'Не удалось обновить подпись');
    }
  };

  const deleteGalleryPhoto = async (id) => {
    if (!confirm('Удалить фото из ленты?')) return;
    try {
      await api.delete(`/gallery/${id}`);
      setGallery(g => g.filter(p => p.id !== id));
    } catch (e) {
      setError(e.response?.data?.message || 'Не удалось удалить фото');
    }
  };

  const moveGalleryPhoto = async (id, direction) => {
    const idx = gallery.findIndex(p => p.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= gallery.length) return;
    const updated = [...gallery];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    const withOrder = updated.map((p, i) => ({ ...p, sort_order: i }));
    setGallery(withOrder);
    try {
      await Promise.all(withOrder.map(p => api.put(`/gallery/${p.id}`, { sort_order: p.sort_order })));
    } catch (e) {
      setError(e.response?.data?.message || 'Не удалось изменить порядок');
      const r = await api.get('/gallery');
      setGallery(r.data);
    }
  };

  const refreshDoctors = async () => {
    const [d, u] = await Promise.all([api.get('/doctors'), api.get('/users')]);
    setDoctors(d.data);
    setUsers(u.data);
  };

  const deleteUser = async (id) => {
    if (!confirm('Удалить пользователя?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(u => u.filter(x => x.id !== id));
    } catch (e) {
      alert(e.response?.data?.message || 'Ошибка удаления');
    }
  };

  const saveServices = async () => {
    setSavingServices(true);
    setError('');
    try {
      const { data } = await api.put('/settings/services', { services });
      setServices(data.services);
      alert('Услуги и цены сохранены');
    } catch (e) {
      setError(e.response?.data?.message || 'Не удалось сохранить услуги');
    } finally {
      setSavingServices(false);
    }
  };

  const changeRole = async (id, role) => {
    try {
      const { data } = await api.patch(`/users/${id}/role`, { role });
      setUsers(u => u.map(x => x.id === id ? data : x));
    } catch (e) {
      alert(e.response?.data?.message || 'Ошибка смены роли');
    }
  };

  const setApptStatus = async (id, status) => {
    const label = status === 'cancelled' ? 'Отменить запись?' : 'Отметить как завершённую?';
    if (!confirm(label)) return;
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      setAppointments(a => a.map(x => x.id === id ? { ...x, status } : x));
    } catch (e) {
      alert(e.response?.data?.message || 'Ошибка обновления');
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAppts = appointments.filter(a =>
    a.patient?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.slot?.doctor?.user?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const activeAppts = appointments.filter(a => a.status === 'active');
  const todayAppts = activeAppts.filter(a => {
    const d = new Date(a.slot?.started_at);
    return d.toDateString() === new Date().toDateString();
  });

  const roleLabel = (role) => role === 'admin' ? 'Администратор' : role === 'doctor' ? 'Врач' : 'Пациент';
  const roleColor = (role) => role === 'admin'
    ? { bg: '#fff0f0', color: '#aa2a2a' }
    : role === 'doctor'
      ? { bg: '#e8f0fb', color: '#1a4a8a' }
      : { bg: '#f5f5f5', color: '#888' };

  const thStyle = { textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: .5, textTransform: 'uppercase', borderBottom: '2px solid #e0e4ea', background: '#fafafa' };
  const btnSm = (color, border) => ({ fontSize: 11, padding: '4px 10px', borderRadius: 2, cursor: 'pointer', border: `1px solid ${border}`, background: '#fff', color, marginRight: 6 });

  const menuItem = (key, label) => (
    <div key={key} onClick={() => { setSection(key); setSearch(''); }}
      style={{ padding: '10px 20px', fontSize: 13, cursor: 'pointer', color: section === key ? '#1a4a8a' : '#555', fontWeight: section === key ? 600 : 400, borderLeft: section === key ? '3px solid #1a4a8a' : '3px solid transparent', background: section === key ? '#f0f5ff' : 'transparent' }}>
      {label}
    </div>
  );

  const statCards = (items) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 28 }}>
      {items.map(([n, l]) => (
        <div key={l} style={{ border: '1px solid #e0e4ea', borderTop: '3px solid #1a4a8a', borderRadius: 2, padding: '14px 16px' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1a4a8a' }}>{n}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{l}</div>
        </div>
      ))}
    </div>
  );

  const sectionTitle = {
    dashboard: 'Обзор',
    users: 'Пользователи',
    doctors: 'Врачи',
    appointments: 'Записи пациентов',
    services: 'Услуги и цены',
    settings: 'Настройки',
    gallery: 'Лента фотографий',
  }[section];

  return (
    <div style={{ background: '#f2f4f7', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid #e0e4ea', borderRadius: 2, display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 600 }}>
          <div style={{ borderRight: '1px solid #eee', padding: '24px 0' }}>
            <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #eee', marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 2, background: '#fff0f0', color: '#aa2a2a', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                {user?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a3a' }}>{user?.full_name}</div>
              <div style={{ fontSize: 11, color: '#aa2a2a', marginTop: 3, background: '#fff0f0', display: 'inline-block', padding: '2px 8px', borderRadius: 2, fontWeight: 600 }}>Администратор</div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: .7, textTransform: 'uppercase', color: '#bbb', padding: '0 20px', marginBottom: 6 }}>Управление</div>
            {[['dashboard', 'Обзор'], ['users', 'Пользователи'], ['doctors', 'Врачи'], ['appointments', 'Записи'], ['services', 'Услуги и цены'], ['gallery', 'Лента фото'], ['settings', 'Настройки']].map(([key, label]) => menuItem(key, label))}
            <div onClick={() => { logout(); navigate('/'); }}
              style={{ padding: '10px 20px', fontSize: 13, color: '#aaa', cursor: 'pointer', marginTop: 16 }}>Выйти</div>
          </div>

          <div style={{ padding: '32px 36px' }}>
            {error && (
              <div style={{ background: '#fff0f0', border: '1px solid #f5c6c6', color: '#c0392b', padding: '10px 14px', marginBottom: 16, fontSize: 13, borderRadius: 2 }}>
                {error}
              </div>
            )}

            {section === 'dashboard' && statCards([
              [users.length, 'Пользователей'],
              [doctors.length, 'Врачей'],
              [activeAppts.length, 'Активных записей'],
              [todayAppts.length, 'Приёмов сегодня'],
            ])}

            {section === 'users' && statCards([
              [users.length, 'Всего'],
              [users.filter(u => u.role === 'patient').length, 'Пациентов'],
              [users.filter(u => u.role === 'doctor').length, 'Врачей'],
              [users.filter(u => u.role === 'admin').length, 'Администраторов'],
            ])}

            {section === 'appointments' && statCards([
              [appointments.length, 'Всего'],
              [appointments.filter(a => a.status === 'active').length, 'Активных'],
              [appointments.filter(a => a.status === 'cancelled').length, 'Отменено'],
              [appointments.filter(a => a.status === 'completed').length, 'Завершено'],
            ])}

            {section === 'settings' && statCards([
              [logo ? 1 : 0, 'Логотип в базе'],
              [users.filter(u => u.role === 'admin').length, 'Администраторов'],
              [doctors.length, 'Врачей'],
              [appointments.length, 'Записей'],
            ])}

            {section === 'gallery' && statCards([
              [gallery.length, 'Фото в ленте'],
              [gallery.filter(p => p.caption).length, 'С подписью'],
              [doctors.length, 'Врачей'],
              [users.length, 'Пользователей'],
            ])}

            {section === 'services' && statCards([
              [services.length, 'Категорий'],
              [services.reduce((sum, group) => sum + (group.items?.length || 0), 0), 'Услуг'],
              [doctors.length, 'Врачей'],
              [appointments.length, 'Записей'],
            ])}

            {section === 'dashboard' ? (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2a3a', marginBottom: 20 }}>Обзор системы</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ border: '1px solid #e0e4ea', borderRadius: 2, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a3a', marginBottom: 12 }}>Ближайшие записи</div>
                    {activeAppts.slice(0, 5).length === 0 ? (
                      <div style={{ fontSize: 13, color: '#aaa' }}>Нет активных записей</div>
                    ) : activeAppts.slice(0, 5).map(a => (
                      <div key={a.id} style={{ fontSize: 13, padding: '8px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{maskName(a.patient?.full_name)} - {a.slot?.doctor?.user?.full_name}</span>
                        <span style={{ color: '#888' }}>
                          {a.slot?.started_at ? new Date(a.slot.started_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ border: '1px solid #e0e4ea', borderRadius: 2, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a3a', marginBottom: 12 }}>Быстрые действия</div>
                    {[['users', 'Управление пользователями'], ['doctors', 'Управление врачами'], ['services', 'Услуги и цены'], ['appointments', 'Все записи']].map(([key, label]) => (
                      <button key={key} onClick={() => setSection(key)}
                        style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: '10px 14px', fontSize: 13, border: '1px solid #d0d5e0', borderRadius: 2, background: '#fafafa', cursor: 'pointer', color: '#1a4a8a', fontWeight: 600 }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : section === 'doctors' ? (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2a3a', marginBottom: 8 }}>Управление врачами</div>
                <p style={{ fontSize: 13, color: '#6b8299', marginBottom: 20, lineHeight: 1.6 }}>
                  Добавляйте врачей, специализации, редактируйте информацию и создавайте расписание приёма.
                </p>
                {section === 'doctors' && statCards([
                  [doctors.length, 'Всего врачей'],
                  [new Set(doctors.map(d => d.specialization_id)).size, 'Специализаций'],
                  [Math.round(doctors.reduce((s, d) => s + d.experience, 0) / Math.max(doctors.length, 1)), 'Средний стаж, лет'],
                  [activeAppts.length, 'Активных записей'],
                ])}
                <AdminDoctorsManage
                  users={users}
                  doctors={doctors}
                  onRefresh={refreshDoctors}
                  setError={setError}
                />
              </>
            ) : section === 'services' ? (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2a3a', marginBottom: 8 }}>Редактирование услуг и цен</div>
                <p style={{ fontSize: 13, color: '#6b8299', marginBottom: 20, lineHeight: 1.6 }}>
                  Добавляйте категории, меняйте названия услуг и стоимость. После сохранения изменения сразу появятся на странице услуг.
                </p>
                <AdminServicesManage
                  services={services}
                  setServices={setServices}
                  onSave={saveServices}
                  saving={savingServices}
                />
              </>
            ) : section === 'settings' ? (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2a3a', marginBottom: 20 }}>Настройки сайта</div>
                <div style={{ border: '1px solid #e0e4ea', borderRadius: 12, padding: 20, maxWidth: 620 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a3a', marginBottom: 12 }}>Логотип аэропорта</div>
                  <div style={{ background: '#f0f5fc', border: '1px solid #d0e0f0', borderRadius: 12, minHeight: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, padding: 14 }}>
                    {logo ? (
                      <img src={logo} alt="Логотип аэропорта Иркутск" style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: 13, color: '#aaa' }}>Логотип не загружен</span>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleLogoFile} style={{ display: 'block', marginBottom: 14, fontSize: 13 }} />
                  <button onClick={saveLogo} disabled={!logo} style={{ padding: '9px 20px', fontSize: 13, border: 'none', borderRadius: 20, background: '#1a4a8a', color: '#fff', cursor: logo ? 'pointer' : 'default', fontWeight: 700, opacity: logo ? 1 : .6 }}>
                    Сохранить в базе
                  </button>
                </div>
              </>
            ) : section === 'gallery' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2a3a' }}>Лента фотографий</div>
                  <label style={{ padding: '9px 18px', fontSize: 13, border: 'none', borderRadius: 20, background: '#1a4a8a', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                    + Добавить фото
                    <input type="file" accept="image/*" onChange={handleGalleryFile} style={{ display: 'none' }} />
                  </label>
                </div>
                <p style={{ fontSize: 13, color: '#6b8299', marginBottom: 20, lineHeight: 1.6 }}>
                  Фотографии отображаются на главной странице в виде карусели. Можно менять порядок, добавлять подписи и удалять снимки.
                </p>
                {loading ? (
                  <div style={{ color: '#aaa', fontSize: 13 }}>Загрузка...</div>
                ) : gallery.length === 0 ? (
                  <div style={{ border: '1px dashed #c8daf0', borderRadius: 12, padding: 40, textAlign: 'center', color: '#8aa0b8', fontSize: 13 }}>
                    Лента пуста. Нажмите «Добавить фото», чтобы загрузить первое изображение.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 16 }}>
                    {gallery.map((photo, idx) => (
                      <div key={photo.id} style={{ display: 'flex', gap: 16, border: '1px solid #e0e8f4', borderRadius: 14, padding: 16, background: '#fafcff' }}>
                        <img src={photo.image} alt={photo.caption || 'Фото'} style={{ width: 180, height: 100, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <input
                            style={{ width: '100%', padding: '8px 14px', border: '1px solid #c8daf0', borderRadius: 20, fontSize: 13, color: '#1a2a3a', background: '#fff', marginBottom: 10 }}
                            placeholder="Подпись к фото..."
                            defaultValue={photo.caption || ''}
                            onBlur={e => {
                              if (e.target.value !== (photo.caption || '')) {
                                updateGalleryCaption(photo.id, e.target.value);
                              }
                            }}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => moveGalleryPhoto(photo.id, -1)} disabled={idx === 0}
                              style={{ ...btnSm('#1a4a8a', '#c0d4f0'), opacity: idx === 0 ? 0.4 : 1 }}>↑ Вверх</button>
                            <button onClick={() => moveGalleryPhoto(photo.id, 1)} disabled={idx === gallery.length - 1}
                              style={{ ...btnSm('#1a4a8a', '#c0d4f0'), opacity: idx === gallery.length - 1 ? 0.4 : 1 }}>↓ Вниз</button>
                            <button onClick={() => deleteGalleryPhoto(photo.id)} style={btnSm('#c0392b', '#f5c6c6')}>Удалить</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2a3a' }}>{sectionTitle}</div>
                  <input style={{ padding: '8px 14px', border: '1px solid #c8daf0', borderRadius: 20, fontSize: 13, width: 240, color: '#1a2a3a', background: '#fff' }}
                    placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                {loading ? <div style={{ color: '#aaa', fontSize: 13 }}>Загрузка...</div> : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      {section === 'users' && <tr>{['Имя', 'Email', 'Роль', 'Регистрация', 'Действия'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>}
                      {section === 'appointments' && <tr>{['Пациент', 'Врач', 'Дата и время', 'Статус', 'Действия'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>}
                    </thead>
                    <tbody>
                      {section === 'users' && filteredUsers.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '11px 12px', fontWeight: 600 }}>{maskName(u.full_name)}</td>
                          <td style={{ padding: '11px 12px', color: '#555' }} title="Email скрыт частично">{maskEmail(u.email)}</td>
                          <td style={{ padding: '11px 12px' }}>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 2, fontWeight: 600, background: roleColor(u.role).bg, color: roleColor(u.role).color }}>{roleLabel(u.role)}</span>
                          </td>
                          <td style={{ padding: '11px 12px', color: '#888' }}>{new Date(u.date_created).toLocaleDateString('ru-RU')}</td>
                          <td style={{ padding: '11px 12px' }}>
                            {u.role !== 'admin' && (
                              <>
                                {u.role === 'patient' && (
                                  <button onClick={() => changeRole(u.id, 'doctor')} style={btnSm('#1a4a8a', '#c0d4f0')}>Врач</button>
                                )}
                                {u.role === 'doctor' && (
                                  <button onClick={() => changeRole(u.id, 'patient')} style={btnSm('#555', '#d0d5e0')}>Пациент</button>
                                )}
                                <button onClick={() => deleteUser(u.id)} style={btnSm('#c0392b', '#f5c6c6')}>Удалить</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                      {section === 'appointments' && filteredAppts.map(a => (
                        <tr key={a.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '11px 12px', fontWeight: 600 }}>{maskName(a.patient?.full_name)}</td>
                          <td style={{ padding: '11px 12px', color: '#555' }}>{a.slot?.doctor?.user?.full_name}</td>
                          <td style={{ padding: '11px 12px', color: '#555' }}>{a.slot?.started_at ? new Date(a.slot.started_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                          <td style={{ padding: '11px 12px' }}>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 2, fontWeight: 600, background: a.status === 'active' ? '#e8f0fb' : '#f5f5f5', color: a.status === 'active' ? '#1a4a8a' : '#aaa' }}>
                              {a.status === 'active' ? 'Активна' : a.status === 'cancelled' ? 'Отменена' : 'Завершена'}
                            </span>
                          </td>
                          <td style={{ padding: '11px 12px' }}>
                            {a.status === 'active' && (
                              <>
                                <button onClick={() => setApptStatus(a.id, 'completed')} style={btnSm('#1a4a8a', '#c0d4f0')}>Завершить</button>
                                <button onClick={() => setApptStatus(a.id, 'cancelled')} style={btnSm('#c0392b', '#f5c6c6')}>Отменить</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
