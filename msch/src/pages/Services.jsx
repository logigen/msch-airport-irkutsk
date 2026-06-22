import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { colors, heroGradient, bannerGradient } from '../theme';

const FALLBACK_SERVICES = [
  {
    category: 'Амбулаторный приём',
    color: '#1a4a8a',
    items: [
      { name: 'Приём терапевта (первичный)', price: '800 ₽' },
      { name: 'Приём терапевта (повторный)', price: '600 ₽' },
      { name: 'Приём невролога', price: '900 ₽' },
      { name: 'Приём офтальмолога', price: '900 ₽' },
      { name: 'Приём отоларинголога', price: '850 ₽' },
      { name: 'Приём хирурга', price: '900 ₽' },
    ]
  },
  {
    category: 'Авиационная медицина',
    color: '#0d5c36',
    items: [
      { name: 'Медицинское освидетельствование (КВС, 2ПЛ)', price: '3 200 ₽' },
      { name: 'Предполётный медосмотр', price: '350 ₽' },
      { name: 'Периодический медосмотр (1 категория)', price: '2 800 ₽' },
      { name: 'Внеочередной осмотр', price: '1 500 ₽' },
    ]
  },
  {
    category: 'Лабораторная диагностика',
    color: '#5c350d',
    items: [
      { name: 'Общий анализ крови (развёрнутый)', price: '450 ₽' },
      { name: 'Биохимический анализ крови', price: '650 ₽' },
      { name: 'Общий анализ мочи', price: '250 ₽' },
      { name: 'Гликированный гемоглобин', price: '550 ₽' },
      { name: 'ПСА (онкомаркер)', price: '700 ₽' },
    ]
  },
  {
    category: 'Инструментальная диагностика',
    color: '#4a1a8a',
    items: [
      { name: 'ЭКГ с расшифровкой', price: '500 ₽' },
      { name: 'Флюорография цифровая', price: '400 ₽' },
      { name: 'Рентгенография (1 проекция)', price: '550 ₽' },
      { name: 'Суточное мониторирование ЭКГ (Холтер)', price: '2 200 ₽' },
      { name: 'Спирометрия', price: '700 ₽' },
    ]
  },
];

const Services = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState(FALLBACK_SERVICES);

  useEffect(() => {
    api.get('/settings/services')
      .then(r => setServices(r.data.services || FALLBACK_SERVICES))
      .catch(() => setServices(FALLBACK_SERVICES));
  }, []);

  return (
    <div style={{ background: colors.pageBg, minHeight: '100vh' }}>
      <div style={{ background: heroGradient, padding: '40px 0 36px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.accentDark, marginBottom: 10, opacity: 0.8 }}>Медицинские услуги</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, marginBottom: 8 }}>Услуги и цены</h1>
          <p style={{ fontSize: 13, color: colors.textMuted }}>Полный прейскурант медицинских услуг</p>
        </div>
      </div>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20, marginBottom: 32 }}>
          {services.map(({ category, color, items }) => (
            <div key={category} style={{ background: '#fff', border: '1px solid #e0e4ea', borderTop: `3px solid ${color}`, borderRadius: 2, padding: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2a3a', marginBottom: 16 }}>{category}</div>
              {items.map(({ name, price }) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f4f8', fontSize: 13 }}>
                  <span style={{ color: '#444', flex: 1 }}>{name}</span>
                  <span style={{ fontWeight: 700, color, marginLeft: 16, whiteSpace: 'nowrap' }}>{price}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ background: bannerGradient, borderRadius: 16, padding: '28px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${colors.lightBlueSoft}`, boxShadow: '0 4px 20px rgba(171,200,236,0.25)' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.accentDark, marginBottom: 6 }}>Запись на приём</div>
            <div style={{ fontSize: 13, color: colors.textMuted }}>Выберите специалиста и удобное время онлайн</div>
          </div>
          <button onClick={() => navigate('/doctors')}
            style={{ padding: '11px 28px', background: colors.accent, color: '#fff', border: 'none', borderRadius: 24, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(61,111,168,0.2)' }}>
            Записаться онлайн
          </button>
        </div>

        <div style={{ marginTop: 20, padding: '16px 20px', background: '#fff', border: '1px solid #e0e4ea', borderLeft: '3px solid #f0a800', borderRadius: 2, fontSize: 13, color: '#7a5c00' }}>
          * Цены носят информационный характер. Окончательная стоимость определяется при обращении. Льготные категории граждан обслуживаются в соответствии с законодательством РФ.
        </div>
      </div>
    </div>
  );
};

export default Services;
