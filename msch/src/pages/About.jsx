import { colors, heroGradient, bannerGradient } from '../theme';

const About = () => (
  <div style={{ background: colors.pageBg, minHeight: '100vh' }}>
    <div style={{ background: heroGradient, padding: '40px 0 36px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.accentDark, marginBottom: 10, opacity: 0.8 }}>Информация</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, marginBottom: 8 }}>О медико-санитарной части</h1>
        <p style={{ fontSize: 13, color: colors.textMuted }}>АО «Международный аэропорт Иркутск»</p>
      </div>
    </div>

    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '36px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28, alignItems: 'start' }}>
        {/* Основной текст */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #e0e4ea', borderTop: '3px solid #1a4a8a', borderRadius: 2, padding: 32, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a2a3a', marginBottom: 16 }}>О клинике</h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, marginBottom: 16 }}>
              Медико-санитарная часть АО «Международный Аэропорт Иркутск» — старейшее лечебно-профилактическое учреждение города Иркутска с более чем 90-летней историей. Основана в 1934 году для медицинского обеспечения деятельности аэропорта.
            </p>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, marginBottom: 16 }}>
              Министерством здравоохранения Иркутской области нам присвоена <strong>первая категория соответствия</strong> организации требованиям, условиям и стандартам в сфере здравоохранения.
            </p>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8 }}>
              МСЧ является <strong>клинической базой кафедры факультетской терапии</strong> Иркутского государственного медицинского университета.
            </p>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e0e4ea', borderRadius: 2, padding: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a2a3a', marginBottom: 16 }}>Лицензированные виды деятельности</h2>
            {['Терапия и общая врачебная практика', 'Неврология', 'Офтальмология', 'Отоларингология', 'Хирургия', 'Лабораторная диагностика', 'Рентгенология и флюорография', 'Функциональная диагностика', 'Авиационная медицина и медосвидетельствование', 'Физиотерапия и реабилитация', 'Стоматология', 'Психиатрия'].map(item => (
              <div key={item} style={{ padding: '10px 0', borderBottom: '1px solid #f0f4f8', display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#444' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1a4a8a', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Сайдбар */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #e0e4ea', borderTop: '3px solid #1a4a8a', borderRadius: 2, padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a3a', marginBottom: 16 }}>Контактная информация</div>
            {[
              ['Адрес', 'г. Иркутск, территория международного аэропорта'],
              ['Регистратура', 'Уточняйте в регистратуре клиники'],
              ['Скорая помощь', 'Круглосуточно на территории аэропорта'],
              ['Email', 'Через официальный сайт аэропорта'],
            ].map(([k, v]) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#1a4a8a', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 13, color: '#444' }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid #e0e4ea', borderRadius: 2, padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2a3a', marginBottom: 14 }}>Режим работы</div>
            {[
              ['Понедельник–Пятница', '07:30 — 19:00'],
              ['Суббота', '08:00 — 14:00'],
              ['Воскресенье', 'Выходной'],
              ['Скорая медицинская помощь', 'Круглосуточно'],
            ].map(([day, time]) => (
              <div key={day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid #f0f4f8' }}>
                <span style={{ color: '#666' }}>{day}</span>
                <strong style={{ color: time === 'Круглосуточно' ? '#1a4a8a' : time === 'Выходной' ? '#aaa' : '#1a2a3a' }}>{time}</strong>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[['90+', 'лет истории'], ['24', 'специалиста'], ['12', 'направлений'], ['1', 'категория МЗ']].map(([n, l]) => (
              <div key={l} style={{ background: bannerGradient, borderRadius: 12, padding: '16px 12px', textAlign: 'center', border: `1px solid ${colors.lightBlueSoft}` }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: colors.accentDark }}>{n}</div>
                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default About;
