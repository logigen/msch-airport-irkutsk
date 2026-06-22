import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import useAuthStore from '../store/authStore';
import { colors } from '../theme';
import { PlaneIcon } from '../components/PlaneIcon';
import BookingSteps from '../components/BookingSteps';
import { Breadcrumbs } from '../components/PageHero';

const Booking = () => {
  const { slotId } = useParams();
  const { state } = useLocation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [slot, setSlot] = useState(state?.slot || null);
  const [doctor, setDoctor] = useState(state?.doctor || null);
  const [pageLoading, setPageLoading] = useState(!state?.slot || !state?.doctor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (slot && doctor) return;

    setPageLoading(true);
    api.get(`/slots/${slotId}`)
      .then(({ data }) => {
        setSlot(data.slot);
        setDoctor(data.doctor);
        setError('');
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Не удалось загрузить данные записи');
      })
      .finally(() => setPageLoading(false));
  }, [slotId, slot, doctor]);

  if (pageLoading) return (
    <div style={{ background: colors.pageBg, minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: colors.textMuted }}>
      Загрузка данных записи...
    </div>
  );

  if (!slot || !doctor) return (
    <div style={{ background: colors.pageBg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', background: '#fff', borderRadius: 20, padding: 40, maxWidth: 400, border: `1px solid ${colors.lightBlue}` }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 8 }}>Данные записи не найдены</div>
        <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>{error || 'Пожалуйста, выберите врача и время заново'}</div>
        <button onClick={() => navigate('/doctors')}
          style={{ padding: '11px 28px', background: colors.accent, color: '#fff', border: 'none', borderRadius: 24, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          К списку врачей
        </button>
      </div>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(slot.started_at) <= new Date()) {
      setError('Нельзя записаться на прошедшее время');
      return;
    }
    if (!slot.is_available) {
      setError('Это время уже занято. Выберите другое время.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/appointments', { slot_id: slot.id });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при записи');
    } finally {
      setLoading(false);
    }
  };

  const slotDate = new Date(slot.started_at);
  const slotTime = slotDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const slotDateStr = slotDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  const ticketRow = (label, value, highlight) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px dashed ${colors.lightBlue}` }}>
      <span style={{ fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: highlight ? 700 : 600, color: highlight ? colors.accent : colors.text, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );

  if (success) return (
    <div style={{ background: colors.pageBg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <div style={{
          background: `linear-gradient(135deg, ${colors.accent}, ${colors.headerDark})`,
          borderRadius: '20px 20px 0 0', padding: '24px 28px', color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8, marginBottom: 4 }}>МСЧ Аэропорт Иркутск</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Запись подтверждена</div>
          </div>
          <PlaneIcon size={40} color="rgba(255,255,255,0.7)" />
        </div>
        <div style={{ background: '#fff', borderRadius: '0 0 20px 20px', padding: 28, border: `1px solid ${colors.lightBlue}`, borderTop: 'none', boxShadow: '0 8px 32px rgba(171,200,236,0.25)' }}>
          {ticketRow('Врач', doctor.user?.full_name)}
          {ticketRow('Специализация', doctor.specialization?.name)}
          {ticketRow('Дата', slotDateStr, true)}
          {ticketRow('Время', slotTime, true)}
          {ticketRow('Адрес', 'Территория аэропорта, Иркутск')}
          <div style={{ marginTop: 16, padding: 14, background: colors.lightBluePale, borderRadius: 12, fontSize: 13, color: colors.textMuted, lineHeight: 1.6 }}>
            Подтверждение отправлено на <strong style={{ color: colors.text }}>{user?.email}</strong>. Отменить запись можно в личном кабинете.
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button onClick={() => navigate('/cabinet')}
              style={{ flex: 1, padding: '12px 0', background: colors.accent, color: '#fff', border: 'none', borderRadius: 24, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Мои записи
            </button>
            <button onClick={() => navigate('/')}
              style={{ flex: 1, padding: '12px 0', background: '#fff', color: colors.accent, border: `1px solid ${colors.lightBlue}`, borderRadius: 24, fontSize: 14, cursor: 'pointer' }}>
              На главную
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: colors.pageBg, minHeight: '100vh' }}>
      <Breadcrumbs items={[
        { label: 'Врачи', path: '/doctors' },
        { label: doctor.user?.full_name, path: `/doctors/${doctor.id}` },
        { label: 'Подтверждение' },
      ]} />
      <BookingSteps current={3} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 48px' }}>
        {/* Талон записи */}
        <div style={{ boxShadow: '0 8px 32px rgba(171,200,236,0.25)', borderRadius: 20, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.headerDark})`,
            padding: '20px 28px', color: '#fff',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', opacity: 0.75, marginBottom: 4 }}>
                Медико-санитарная часть · Аэропорт Иркутск
              </div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Талон на приём</div>
            </div>
            <PlaneIcon size={36} color="rgba(255,255,255,0.65)" />
          </div>
          <div style={{ background: '#fff', padding: '8px 28px 20px' }}>
            {ticketRow('Врач', doctor.user?.full_name)}
            {ticketRow('Специализация', doctor.specialization?.name)}
            {ticketRow('Дата', slotDateStr, true)}
            {ticketRow('Время', `${slotTime} — ${new Date(slot.ended_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`, true)}
            {ticketRow('Пациент', user?.full_name)}
            {ticketRow('Email', user?.email)}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 20, padding: 28, border: `1px solid ${colors.lightBluePale}`, boxShadow: '0 4px 20px rgba(171,200,236,0.12)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 6 }}>Подтвердите запись</div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
            Проверьте данные выше. После подтверждения врач увидит вас в расписании, а вы сможете отменить запись в личном кабинете.
          </div>

          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #f5c6c6', color: '#c0392b', padding: '12px 16px', marginBottom: 16, fontSize: 13, borderRadius: 12 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => navigate('/doctors')}
              style={{ flex: '1 1 150px', padding: '13px 0', background: '#fff', color: colors.accent, border: `1px solid ${colors.lightBlue}`, borderRadius: 24, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
              Выбрать врача
            </button>
            <button type="button" onClick={() => navigate(`/doctors/${doctor.id}`)}
              style={{ flex: '1 1 150px', padding: '13px 0', background: '#fff', color: colors.textMuted, border: `1px solid ${colors.lightBlue}`, borderRadius: 24, fontSize: 14, cursor: 'pointer' }}>
              Изменить время
            </button>
            <button type="submit" disabled={loading}
              style={{
                flex: '2 1 220px', padding: '13px 0', background: loading ? '#aaa' : colors.accent,
                color: '#fff', border: 'none', borderRadius: 24, fontSize: 15, fontWeight: 700,
                cursor: loading ? 'default' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(61,111,168,0.3)',
              }}>
              {loading ? 'Отправка...' : 'Подтвердить запись'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Booking;
