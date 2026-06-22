import { useNavigate } from 'react-router-dom';
import PhotoCarousel from '../components/PhotoCarousel';
import { PlaneDecor } from '../components/PlaneIcon';
import { colors, heroGradient, statsGradient, bannerGradient, footerGradient } from '../theme';

const SERVICES = [
  { icon: 'Т', title: 'Терапия', desc: 'Лечение заболеваний внутренних органов, ежегодные осмотры' },
  { icon: 'Н', title: 'Неврология', desc: 'Диагностика и лечение нарушений нервной системы' },
  { icon: 'О', title: 'Офтальмология', desc: 'Проверка зрения, лечение болезней глаз' },
  { icon: 'А', title: 'Авиамедицина', desc: 'Медосвидетельствование летного и диспетчерского состава' },
  { icon: 'Л', title: 'Лаборатория', desc: 'Широкий спектр клинических и биохимических анализов' },
  { icon: 'Р', title: 'Рентгенология', desc: 'Цифровая рентгенография, флюорография' },
];

const STATS = [
  { n: '90+', label: 'лет истории' },
  { n: '24', label: 'специалиста' },
  { n: '12', label: 'направлений' },
  { n: '1', label: 'категория МЗ' },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: colors.pageBg, minHeight: '100vh' }}>

      {/* HERO */}
      <div style={{ background: heroGradient, padding: '64px 0 56px', position: 'relative', overflow: 'hidden' }}>
        <PlaneDecor opacity={0.2} style={{ right: 80, top: 30, transform: 'rotate(-12deg)' }} />
        <PlaneDecor opacity={0.1} style={{ left: 40, bottom: 20, transform: 'rotate(20deg) scale(0.6)' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.35 }}>
          <svg width="100%" height="100%" viewBox="0 0 1200 320" preserveAspectRatio="none">
            <circle cx="900" cy="80" r="200" fill="white"/>
            <circle cx="100" cy="280" r="120" fill="white"/>
            <ellipse cx="600" cy="160" rx="400" ry="80" fill="white"/>
          </svg>
        </div>

        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 4, height: 32, background: colors.accent, borderRadius: 2 }} />
            <span style={{ fontSize: 12, letterSpacing: 2.5, textTransform: 'uppercase', color: colors.accentDark, fontWeight: 500 }}>Медико-санитарная часть</span>
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 700, color: colors.text, lineHeight: 1.15, marginBottom: 16, maxWidth: 680, letterSpacing: -0.5 }}>
            Медицинская помощь<br/>
            <span style={{ color: colors.accent }}>на борту и на земле</span>
          </h1>
          <p style={{ fontSize: 15, color: colors.textMuted, maxWidth: 540, lineHeight: 1.7, marginBottom: 36 }}>
            Старейшее лечебно-профилактическое учреждение Иркутска при международном аэропорту. Медицинское обеспечение летного состава и медицинская помощь пассажирам с 1934 года.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/doctors')}
              style={{ padding: '12px 28px', background: colors.accent, color: '#fff', border: 'none', borderRadius: 24, fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.3, boxShadow: '0 4px 16px rgba(61,111,168,0.25)' }}>
              Записаться к врачу
            </button>
            <button onClick={() => navigate('/services')}
              style={{ padding: '12px 28px', background: 'rgba(255,255,255,0.7)', color: colors.accentDark, border: '1px solid rgba(61,111,168,0.25)', borderRadius: 24, fontSize: 14, cursor: 'pointer', letterSpacing: 0.3 }}>
              Услуги и цены
            </button>
          </div>
        </div>
      </div>

      {/* СТАТИСТИКА */}
      <div style={{ background: statsGradient }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {STATS.map(({ n, label }, i) => (
            <div key={label} style={{ padding: '22px 0', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.4)' : 'none' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: colors.accentDark }}>{n}</div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ЛЕНТА ФОТОГРАФИЙ */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '40px 24px 0' }}>
        <PhotoCarousel />
      </div>

      {/* БЫСТРЫЙ ДОСТУП */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '40px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 48 }}>
          {[
            { icon: '01', title: 'Запись на приём', desc: 'Выберите врача и удобное время', action: () => navigate('/doctors'), btn: 'Выбрать врача', color: colors.accent },
            { icon: '02', title: 'Медосвидетельствование', desc: 'Для летного и технического персонала', action: () => navigate('/services'), btn: 'Подробнее', color: '#5a9fd4' },
            { icon: '24', title: 'Экстренная помощь', desc: 'Круглосуточная медицинская помощь в аэропорту', action: () => navigate('/about'), btn: 'Контакты', color: colors.accentDark },
          ].map(({ icon, title, desc, action, btn, color }) => (
            <div key={title} style={{ background: '#fff', border: `1px solid ${colors.lightBlue}`, borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(171,200,236,0.2)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(171,200,236,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(171,200,236,0.2)'; }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: colors.lightBluePale, color: colors.accentDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.55, marginBottom: 20 }}>{desc}</div>
              <button onClick={action}
                style={{ fontSize: 12, padding: '9px 18px', background: color, color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 600 }}>
                {btn}
              </button>
            </div>
          ))}
        </div>

        {/* НАПРАВЛЕНИЯ */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>Направления медицинской помощи</h2>
            <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${colors.lightBlue}, transparent)` }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {SERVICES.map(({ icon, title, desc }) => (
              <div key={title}
                style={{ background: '#fff', border: `1px solid ${colors.lightBluePale}`, borderRadius: 14, padding: '22px 24px', display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer', boxShadow: '0 2px 12px rgba(171,200,236,0.15)', transition: 'all 0.2s ease' }}
                onClick={() => navigate('/doctors')}
                onMouseEnter={e => { e.currentTarget.style.borderColor = colors.lightBlue; e.currentTarget.style.boxShadow = '0 6px 24px rgba(171,200,236,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = colors.lightBluePale; e.currentTarget.style.boxShadow = '0 2px 12px rgba(171,200,236,0.15)'; }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.accentDark, lineHeight: 1, marginTop: 2, width: 40, height: 40, borderRadius: 12, background: colors.lightBluePale, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ИНФОРМАЦИОННЫЙ БАННЕР */}
        <div style={{ background: bannerGradient, borderRadius: 20, padding: '36px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48, boxShadow: '0 8px 32px rgba(171,200,236,0.35)', border: `1px solid ${colors.lightBlueSoft}` }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.accentDark, marginBottom: 6 }}>Клиническая база ИГМУ</div>
            <div style={{ fontSize: 13, color: colors.textMuted, maxWidth: 520, lineHeight: 1.6 }}>
              МСЧ является клинической базой кафедры факультетской терапии Иркутского государственного медицинского университета. Первая категория соответствия Министерства здравоохранения Иркутской области.
            </div>
          </div>
          <button onClick={() => navigate('/about')}
            style={{ flexShrink: 0, padding: '11px 26px', background: colors.accent, color: '#fff', border: 'none', borderRadius: 24, fontSize: 13, cursor: 'pointer', marginLeft: 32, fontWeight: 600, boxShadow: '0 4px 12px rgba(61,111,168,0.2)' }}>
            О клинике
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: footerGradient, padding: '40px 0 24px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 32, marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 10, letterSpacing: 0.5 }}>МСЧ Аэропорт Иркутск</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                Медико-санитарная часть АО «Международный Аэропорт Иркутск»<br/>
                Старейшее ЛПУ Иркутска, работающее с 1934 года.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>Контакты</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 2 }}>
                г. Иркутск, ул. Ширямова, 13<br/>
                Регистратура — см. раздел «О нас»
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>Режим работы</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 2 }}>
                Пн–Пт: 07:30–19:00<br/>
                Сб: 08:00–14:00<br/>
                Скорая: круглосуточно
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            © 2024 МСЧ АО «Международный аэропорт Иркутск»
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
