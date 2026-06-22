import { useEffect, useState } from 'react';
import api from '../api';
import { colors } from '../theme';

const PhotoCarousel = () => {
  const [photos, setPhotos] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/gallery')
      .then(({ data }) => setPhotos(data))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (photos.length <= 1) return undefined;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % photos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [photos.length]);

  if (loading) {
    return (
      <div style={{ background: colors.lightBluePale, borderRadius: 20, height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.accent, fontSize: 14 }}>
        Загрузка...
      </div>
    );
  }

  if (!photos.length) return null;

  const go = (dir) => setCurrent(prev => (prev + dir + photos.length) % photos.length);

  return (
    <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 32px rgba(26,74,138,0.12)', background: '#fff' }}>
      <div style={{ position: 'relative', height: 360, overflow: 'hidden' }}>
        {photos.map((photo, i) => (
          <div key={photo.id}
            style={{
              position: 'absolute', inset: 0,
              opacity: i === current ? 1 : 0,
              transition: 'opacity 0.7s ease',
              pointerEvents: i === current ? 'auto' : 'none',
            }}>
            <img src={photo.image} alt={photo.caption || 'Фото клиники'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {photo.caption && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(transparent, rgba(13,45,94,0.75))',
                padding: '40px 28px 20px',
                color: '#fff', fontSize: 15, fontWeight: 500,
              }}>
                {photo.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Предыдущее"
            style={{
              position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              width: 44, height: 44, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.92)', color: colors.accent,
              fontSize: 20, cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>‹</button>
          <button onClick={() => go(1)} aria-label="Следующее"
            style={{
              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              width: 44, height: 44, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.92)', color: colors.accent,
              fontSize: 20, cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>›</button>

          <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
            {photos.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} aria-label={`Слайд ${i + 1}`}
                style={{
                  width: i === current ? 24 : 8, height: 8, borderRadius: 4, border: 'none',
                  background: i === current ? '#fff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', transition: 'all 0.3s ease', padding: 0,
                }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PhotoCarousel;
