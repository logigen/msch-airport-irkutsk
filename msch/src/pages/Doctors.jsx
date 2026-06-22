import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { colors } from '../theme';
import PageHero from '../components/PageHero';
import BookingSteps from '../components/BookingSteps';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [specId, setSpecId] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/doctors').then(r => setDoctors(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = doctors.filter(d => {
    const name = d.user?.full_name?.toLowerCase() || '';
    const matchSearch = name.includes(search.toLowerCase());
    const matchSpec = specId ? d.specialization_id === Number(specId) : true;
    return matchSearch && matchSpec;
  });

  const uniqueSpecs = [...new Map(doctors.map(d => [d.specialization_id, d.specialization])).entries()]
    .map(([id, spec]) => ({ id, name: spec?.name })).filter(s => s.name);

  const pillStyle = (active) => ({
    fontSize: 13, padding: '8px 18px', borderRadius: 20, cursor: 'pointer', fontWeight: 500,
    border: `1px solid ${active ? colors.accent : colors.lightBlue}`,
    background: active ? colors.accent : '#fff',
    color: active ? '#fff' : colors.textMuted,
    transition: 'all 0.15s ease',
  });

  return (
    <div style={{ background: colors.pageBg, minHeight: '100vh' }}>
      <PageHero
        tag="Запись на приём"
        title="Выберите специалиста"
        subtitle="Медико-санитарная часть международного аэропорта Иркутск. Запишитесь к врачу онлайн — быстро и удобно."
      />
      <BookingSteps current={1} />

      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.lightBluePale}` }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '18px 24px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 320 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: colors.textMuted, fontWeight: 700 }}>Поиск</span>
            <input
              style={{
                width: '100%', padding: '10px 16px 10px 58px',
                border: `1px solid ${colors.lightBlue}`, borderRadius: 24, fontSize: 14,
                color: colors.text, background: colors.lightBluePale, outline: 'none', boxSizing: 'border-box',
              }}
              placeholder="Поиск по фамилии..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => setSpecId('')} style={pillStyle(!specId)}>Все</button>
            {uniqueSpecs.map(s => (
              <button key={s.id} onClick={() => setSpecId(String(s.id))} style={pillStyle(specId === String(s.id))}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 24px 48px' }}>
        <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>
          Найдено специалистов: <strong style={{ color: colors.accentDark }}>{filtered.length}</strong>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: colors.textMuted }}>Загрузка специалистов...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: `1px dashed ${colors.lightBlue}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 12 }}>Поиск</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 6 }}>Врачи не найдены</div>
            <div style={{ fontSize: 13, color: colors.textMuted }}>Попробуйте изменить фильтры или поисковый запрос</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {filtered.map(d => (
              <div key={d.id}
                onClick={() => navigate(`/doctors/${d.id}`)}
                style={{
                  background: '#fff', border: `1px solid ${colors.lightBluePale}`, borderRadius: 16,
                  padding: 24, cursor: 'pointer', transition: 'all 0.2s ease',
                  boxShadow: '0 2px 12px rgba(171,200,236,0.12)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(171,200,236,0.28)';
                  e.currentTarget.style.borderColor = colors.lightBlue;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(171,200,236,0.12)';
                  e.currentTarget.style.borderColor = colors.lightBluePale;
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: `linear-gradient(135deg, ${colors.lightBlue}, ${colors.lightBlueSoft})`,
                    color: colors.accentDark, fontSize: 16, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {d.user?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, lineHeight: 1.3 }}>{d.user?.full_name}</div>
                    <div style={{ fontSize: 12, color: colors.accent, fontWeight: 600, marginTop: 3 }}>{d.specialization?.name}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>
                  Стаж работы: <strong style={{ color: colors.text }}>{d.experience} лет</strong>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); navigate(`/doctors/${d.id}`); }}
                  style={{
                    width: '100%', padding: '10px 0', background: colors.accent, color: '#fff',
                    border: 'none', borderRadius: 24, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>
                  Выбрать время
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Doctors;
