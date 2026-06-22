import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import useAuthStore from '../store/authStore';
import { colors } from '../theme';
import { PlaneIcon } from '../components/PlaneIcon';
import BookingSteps from '../components/BookingSteps';
import { Breadcrumbs } from '../components/PageHero';

const DoctorProfile = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const getBookingRange = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  useEffect(() => {
    api.get(`/doctors/${id}`).then(r => setDoctor(r.data));
  }, [id]);

  useEffect(() => {
    const { start, end } = getBookingRange();
    api.get(`/slots?doctor_id=${id}&date_from=${start.toISOString()}&date_to=${end.toISOString()}`)
      .then(r => setSlots(r.data));
  }, [id]);

  const handleBook = () => {
    if (!selectedSlot) return;
    if (!user) return navigate('/auth', { state: { fromBooking: true, from: `/doctors/${id}` } });
    navigate(`/booking/${selectedSlot.id}`, { state: { slot: selectedSlot, doctor } });
  };

  if (!doctor) return (
    <div style={{ background: colors.pageBg, minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: colors.textMuted }}>
      Загрузка профиля врача...
    </div>
  );

  const { start, end } = getBookingRange();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      date: d,
      slots: slots.filter(s => {
        const sd = new Date(s.started_at);
        return sd.getDate() === d.getDate()
          && sd.getMonth() === d.getMonth()
          && sd.getFullYear() === d.getFullYear();
      }).sort((a, b) => new Date(a.started_at) - new Date(b.started_at)),
    };
  }).filter(day => day.date.getDay() !== 0);

  const rangeLabel = `${start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} — ${end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  return (
    <div style={{ background: colors.pageBg, minHeight: '100vh' }}>
      <Breadcrumbs items={[
        { label: 'Главная', path: '/' },
        { label: 'Врачи', path: '/doctors' },
        { label: doctor.user?.full_name },
      ]} />
      <BookingSteps current={2} />

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 24px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Карточка врача */}
          <div style={{
            background: '#fff', border: `1px solid ${colors.lightBluePale}`, borderRadius: 20,
            padding: 28, position: 'sticky', top: 20,
            boxShadow: '0 4px 20px rgba(171,200,236,0.15)',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 20, marginBottom: 16,
              background: `linear-gradient(135deg, ${colors.lightBlue}, ${colors.accent})`,
              color: '#fff', fontSize: 22, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {doctor.user?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 4 }}>{doctor.user?.full_name}</div>
            <div style={{
              display: 'inline-block', fontSize: 12, color: colors.accent, fontWeight: 600,
              background: colors.lightBluePale, padding: '4px 12px', borderRadius: 12, marginBottom: 16,
            }}>
              {doctor.specialization?.name}
            </div>
            <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>
              Стаж: <strong style={{ color: colors.text }}>{doctor.experience} лет</strong>
            </div>
            <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>
              Приём: <strong style={{ color: colors.text }}>{doctor.work_start || '08:00'} — {doctor.work_end || '16:00'}</strong>
            </div>
            {doctor.bio && (
              <p style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.65, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.lightBluePale}` }}>
                {doctor.bio}
              </p>
            )}

            {selectedSlot && (
              <div style={{
                marginTop: 20, padding: 16, background: colors.lightBluePale,
                borderRadius: 14, border: `1px solid ${colors.lightBlue}`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.accentDark, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Выбрано
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
                  {new Date(selectedSlot.started_at).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: colors.accent, marginTop: 4 }}>
                  {new Date(selectedSlot.started_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <button onClick={handleBook}
                  style={{
                    width: '100%', marginTop: 14, padding: '12px 0',
                    background: colors.accent, color: '#fff', border: 'none',
                    borderRadius: 24, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(61,111,168,0.25)',
                  }}>
                  Продолжить запись
                </button>
              </div>
            )}
            <button onClick={() => navigate('/doctors')}
              style={{
                width: '100%', marginTop: selectedSlot ? 12 : 20, padding: '11px 0',
                background: '#fff', color: colors.accent, border: `1px solid ${colors.lightBlue}`,
                borderRadius: 24, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
              Выбрать другого врача
            </button>
          </div>

          {/* Расписание */}
          <div style={{
            background: '#fff', border: `1px solid ${colors.lightBluePale}`, borderRadius: 20,
            padding: 28, boxShadow: '0 4px 20px rgba(171,200,236,0.12)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 4 }}>Расписание приёма</div>
                <div style={{ fontSize: 13, color: colors.textMuted }}>Запись открыта только на ближайшие 7 дней</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.4 }}>
                <PlaneIcon size={24} color={colors.accent} />
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: colors.lightBluePale, borderRadius: 14, padding: '12px 16px', marginBottom: 20,
              gap: 12, flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 14, color: colors.text, fontWeight: 600 }}>
                {rangeLabel}
              </span>
              <button onClick={() => navigate('/doctors')}
                style={{ padding: '8px 14px', borderRadius: 18, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 12, color: colors.accent, fontWeight: 700, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                Другой врач
              </button>
            </div>

            {/* Легенда */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 16, fontSize: 12, color: colors.textMuted }}>
              {[
                ['Свободно', colors.lightBluePale, colors.lightBlue],
                ['Выбрано', colors.accent, colors.accent],
                ['Занято', '#f5f5f5', '#e0e0e0'],
              ].map(([label, bg, border]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 4, background: bg, border: `2px solid ${border}` }} />
                  {label}
                </div>
              ))}
            </div>

            {/* Сетка расписания */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(104px, 1fr))', gap: 10 }}>
              {days.map((day, i) => {
                const isToday = day.date.toDateString() === new Date().toDateString();
                const isPast = day.date < new Date() && !isToday;
                return (
                  <div key={i}>
                    <div style={{
                      textAlign: 'center', padding: '10px 6px', borderRadius: 12, marginBottom: 8,
                      background: isToday ? colors.accent : isPast ? '#fafafa' : colors.lightBluePale,
                      border: `1px solid ${isToday ? colors.accent : colors.lightBluePale}`,
                    }}>
                      <div style={{ fontSize: 11, color: isToday ? 'rgba(255,255,255,0.8)' : colors.textMuted, fontWeight: 600 }}>
                        {day.date.toLocaleDateString('ru-RU', { weekday: 'short' })}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: isToday ? '#fff' : colors.text }}>{day.date.getDate()}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 40 }}>
                      {day.slots.length === 0 && (
                        <div style={{ textAlign: 'center', fontSize: 11, color: '#ccc', padding: '8px 4px' }}>—</div>
                      )}
                      {day.slots.map(slot => {
                        const isSlotPast = new Date(slot.started_at) <= new Date();
                        const isSelected = selectedSlot?.id === slot.id;
                        const isUnavailable = !slot.is_available || isSlotPast;
                        return (
                          <button key={slot.id} type="button"
                            disabled={isUnavailable}
                            onClick={() => setSelectedSlot(slot)}
                            style={{
                              border: `2px solid ${isSelected ? colors.accent : isUnavailable ? '#eee' : colors.lightBlue}`,
                              borderRadius: 10, padding: '8px 4px', textAlign: 'center',
                              background: isSelected ? colors.accent : isUnavailable ? '#fafafa' : '#fff',
                              color: isSelected ? '#fff' : isUnavailable ? '#ccc' : colors.accentDark,
                              cursor: isUnavailable ? 'not-allowed' : 'pointer',
                              fontSize: 13, fontWeight: isSelected ? 700 : 500,
                              transition: 'all 0.15s ease',
                            }}>
                            {new Date(slot.started_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {!selectedSlot && (
              <div style={{
                marginTop: 24, padding: 16, textAlign: 'center',
                background: colors.lightBluePale, borderRadius: 12,
                fontSize: 13, color: colors.textMuted,
              }}>
                Нажмите на свободное время, чтобы продолжить запись
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
