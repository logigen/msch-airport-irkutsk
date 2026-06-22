import { colors } from '../theme';
import { PlaneIcon } from './PlaneIcon';

const STEPS = [
  { n: 1, label: 'Выбор врача' },
  { n: 2, label: 'Дата и время' },
  { n: 3, label: 'Подтверждение' },
];

const BookingSteps = ({ current = 1 }) => (
  <div style={{
    background: '#fff',
    borderBottom: `1px solid ${colors.lightBlue}`,
    boxShadow: '0 2px 12px rgba(171,200,236,0.15)',
  }}>
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
        {STEPS.map((step, i) => {
          const done = current > step.n;
          const active = current === step.n;
          return (
            <div key={step.n} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: done ? colors.accent : active ? colors.accent : colors.lightBluePale,
                  color: done || active ? '#fff' : colors.textMuted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700,
                  border: active ? `2px solid ${colors.lightBlue}` : '2px solid transparent',
                  boxShadow: active ? '0 0 0 4px rgba(171,200,236,0.35)' : 'none',
                  transition: 'all 0.2s ease',
                }}>
                  {step.n}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? colors.accentDark : done ? colors.accent : colors.textMuted }}>
                    {step.label}
                  </div>
                  {active && (
                    <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>Текущий шаг</div>
                  )}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 48, height: 2, margin: '0 16px',
                  background: done ? colors.accent : colors.lightBlue,
                  borderRadius: 1,
                }} />
              )}
            </div>
          );
        })}
        <div style={{ marginLeft: 20, opacity: 0.5 }}>
          <PlaneIcon size={28} color={colors.accent} />
        </div>
      </div>
    </div>
  </div>
);

export default BookingSteps;
