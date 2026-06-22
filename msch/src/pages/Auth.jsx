import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { colors } from '../theme';
import { PlaneIcon } from '../components/PlaneIcon';

const Auth = () => {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', full_name: '', confirm: '' });
  const { login, register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const fromBooking = location.state?.fromBooking;

  const handleChange = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await login(form.email, form.password);
      const dest = user.role === 'doctor' ? '/doctor-cabinet' : user.role === 'admin' ? '/admin' : from;
      navigate(dest);
    } catch {}
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm || form.password.length < 8) return;
    try {
      await register(form.full_name, form.email, form.password);
      navigate(from);
    } catch {}
  };

  const switchTab = (t) => { setTab(t); clearError(); setForm({ email: '', password: '', full_name: '', confirm: '' }); };

  const inputStyle = { width: '100%', padding: '12px 16px', border: `1px solid ${colors.lightBlue}`, borderRadius: 12, fontSize: 14, color: colors.text, marginBottom: 16, boxSizing: 'border-box', background: '#fff', outline: 'none' };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: colors.textMuted, display: 'block', marginBottom: 6 };

  return (
    <div style={{ background: colors.pageBg, minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -20, top: 60, opacity: 0.08, pointerEvents: 'none' }}>
        <PlaneIcon size={200} color={colors.accent} />
      </div>
      <div style={{ maxWidth: 440, margin: 'auto', background: '#fff', border: `1px solid ${colors.lightBluePale}`, borderRadius: 20, padding: 36, width: '100%', boxShadow: '0 8px 32px rgba(171,200,236,0.2)', position: 'relative', zIndex: 1 }}>

        {fromBooking && (
          <div style={{ background: colors.lightBluePale, border: `1px solid ${colors.lightBlue}`, borderRadius: 12, padding: '14px 16px', marginBottom: 24, fontSize: 13, color: colors.accentDark, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <PlaneIcon size={22} color={colors.accent} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Для записи к врачу нужна авторизация</strong><br/>
              Войдите или зарегистрируйтесь — это займёт меньше минуты.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', borderBottom: `2px solid ${colors.lightBluePale}`, marginBottom: 28 }}>
          {[['login', 'Вход'], ['register', 'Регистрация']].map(([key, label]) => (
            <div key={key} onClick={() => switchTab(key)}
              style={{ flex: 1, padding: '10px 0', textAlign: 'center', fontSize: 14, fontWeight: 600, color: tab === key ? colors.accent : colors.textMuted, cursor: 'pointer', borderBottom: tab === key ? `2px solid ${colors.accent}` : '2px solid transparent', marginBottom: -2 }}>
              {label}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: '#fff0f0', border: '1px solid #f5c6c6', color: '#c0392b', padding: '10px 14px', marginBottom: 16, fontSize: 13, borderRadius: 2 }}>
            {error}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={handleChange('email')} placeholder="example@mail.ru" autoComplete="email" required />
            <label style={labelStyle}>Пароль</label>
            <input style={inputStyle} type="password" value={form.password} onChange={handleChange('password')} placeholder="Введите пароль" autoComplete="current-password" required />
            <button type="submit" style={{ width: '100%', padding: 13, background: colors.accent, color: '#fff', border: 'none', borderRadius: 24, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 14 }} disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
            <div style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>
              Нет аккаунта? <span style={{ color: colors.accent, cursor: 'pointer', fontWeight: 600 }} onClick={() => switchTab('register')}>Зарегистрироваться</span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <label style={labelStyle}>Полное имя</label>
            <input style={inputStyle} value={form.full_name} onChange={handleChange('full_name')} placeholder="Иванов Алексей Иванович" required />
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={handleChange('email')} placeholder="example@mail.ru" autoComplete="email" required />
            <label style={labelStyle}>Пароль</label>
            <input style={{ ...inputStyle, borderColor: form.password && form.password.length < 8 ? '#c0392b' : '#d0d5e0' }} type="password" value={form.password} onChange={handleChange('password')} placeholder="Минимум 8 символов" autoComplete="new-password" required />
            {form.password && form.password.length < 8 && (
              <div style={{ fontSize: 12, color: '#c0392b', marginTop: -12, marginBottom: 14 }}>Минимум 8 символов</div>
            )}
            <label style={labelStyle}>Повторите пароль</label>
            <input style={inputStyle} type="password" value={form.confirm} onChange={handleChange('confirm')} placeholder="Повторите пароль" autoComplete="new-password" required />
            {form.confirm && form.password !== form.confirm && (
              <div style={{ fontSize: 12, color: '#c0392b', marginTop: -12, marginBottom: 14 }}>Пароли не совпадают</div>
            )}
            <button type="submit"
              style={{ width: '100%', padding: 13, background: (form.confirm && form.password !== form.confirm) || (form.password && form.password.length < 8) ? '#aaa' : colors.accent, color: '#fff', border: 'none', borderRadius: 24, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 14 }}
              disabled={loading || !!(form.confirm && form.password !== form.confirm) || !!(form.password && form.password.length < 8)}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
            <div style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>
              Уже есть аккаунт? <span style={{ color: colors.accent, cursor: 'pointer', fontWeight: 600 }} onClick={() => switchTab('login')}>Войти</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
