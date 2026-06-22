import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { colors, headerGradient } from '../theme';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const cabinetPath = user?.role === 'doctor' ? '/doctor-cabinet'
    : user?.role === 'admin' ? '/admin'
    : '/cabinet';

  const navLinkStyle = {
    fontSize: 13, color: 'rgba(255,255,255,0.9)', textDecoration: 'none',
    padding: '8px 16px', borderRadius: 20, fontWeight: 500, letterSpacing: 0.2,
    transition: 'background 0.2s ease',
  };

  return (
    <>
      <div style={{ background: `linear-gradient(90deg, ${colors.headerDarker}, ${colors.headerDark})`, padding: '7px 0', fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Медико-санитарная часть АО «Международный аэропорт Иркутск»</span>
          <span>Регистратура — на территории аэропорта</span>
        </div>
      </div>

      <header style={{ background: headerGradient, padding: '0', boxShadow: '0 4px 20px rgba(26,74,138,0.2)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 76 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: '6px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              <img
                src="/logo-airport.png"
                alt="Международный аэропорт Иркутск"
                style={{ display: 'block', height: 52, width: 'auto', maxWidth: 260, objectFit: 'contain' }}
              />
            </div>
          </Link>

          <nav style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[['/', 'Главная'], ['/doctors', 'Врачи'], ['/services', 'Услуги'], ['/about', 'О нас']].map(([path, label]) => (
              <Link key={path} to={path} style={navLinkStyle}
                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}>
                {label}
              </Link>
            ))}
          </nav>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link to={cabinetPath} style={{ fontSize: 13, color: colors.headerDark, textDecoration: 'none', fontWeight: 600, background: 'rgba(255,255,255,0.92)', padding: '8px 18px', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                {user.full_name.split(' ')[0]}
              </Link>
              <button onClick={handleLogout} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', border: 'none', background: 'none', cursor: 'pointer' }}>Выйти</button>
            </div>
          ) : (
            <Link to="/auth">
              <button style={{ background: '#fff', color: colors.headerDark, border: 'none', borderRadius: 20, padding: '9px 22px', fontSize: 13, cursor: 'pointer', fontWeight: 700, letterSpacing: 0.3, boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
                Записаться
              </button>
            </Link>
          )}
        </div>
      </header>
    </>
  );
};

export default Navbar;
