import { useNavigate } from 'react-router-dom';
import { colors, heroGradient } from '../theme';
import { PlaneDecor } from './PlaneIcon';

const PageHero = ({ tag, title, subtitle, children }) => (
  <div style={{ background: heroGradient, padding: '36px 0 32px', position: 'relative', overflow: 'hidden' }}>
    <PlaneDecor opacity={0.15} style={{ right: 40, top: 20, transform: 'rotate(-15deg)' }} />
    <PlaneDecor opacity={0.08} style={{ left: 60, bottom: 10, transform: 'rotate(25deg) scale(0.7)' }} />
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
      {tag && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 3, height: 20, background: colors.accent, borderRadius: 2 }} />
          <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.accentDark, fontWeight: 600 }}>{tag}</span>
        </div>
      )}
      <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, marginBottom: 8 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 14, color: colors.textMuted, maxWidth: 560, lineHeight: 1.6 }}>{subtitle}</p>}
      {children}
    </div>
  </div>
);

export const Breadcrumbs = ({ items }) => {
  const navigate = useNavigate();
  return (
    <div style={{ background: '#fff', borderBottom: `1px solid ${colors.lightBluePale}` }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '12px 24px', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {items.map((item, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <span style={{ color: colors.lightBlue }}>›</span>}
            {item.path ? (
              <span onClick={() => navigate(item.path)} style={{ color: colors.accent, cursor: 'pointer', fontWeight: 500 }}>
                {item.label}
              </span>
            ) : (
              <span style={{ color: colors.textMuted }}>{item.label}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PageHero;
