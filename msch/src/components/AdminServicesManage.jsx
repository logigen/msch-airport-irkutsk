import { colors } from '../theme';

const inputStyle = {
  width: '100%',
  padding: '9px 14px',
  border: `1px solid ${colors.lightBlue}`,
  borderRadius: 10,
  fontSize: 13,
  color: colors.text,
  background: '#fff',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: colors.textMuted,
  display: 'block',
  marginBottom: 5,
};

const btnPrimary = {
  padding: '9px 20px',
  fontSize: 13,
  border: 'none',
  borderRadius: 20,
  background: colors.accent,
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
};

const btnSm = (color, border) => ({
  fontSize: 11,
  padding: '5px 12px',
  borderRadius: 8,
  cursor: 'pointer',
  border: `1px solid ${border}`,
  background: '#fff',
  color,
});

const cardStyle = {
  border: `1px solid ${colors.lightBluePale}`,
  borderRadius: 14,
  padding: 18,
  background: '#fafcff',
  marginBottom: 16,
};

const emptyGroup = () => ({
  category: 'Новая категория',
  color: '#1a4a8a',
  items: [{ name: 'Новая услуга', price: '0 ₽' }],
});

const AdminServicesManage = ({ services, setServices, onSave, saving }) => {
  const updateGroup = (index, field, value) => {
    setServices(prev => prev.map((group, i) => (
      i === index ? { ...group, [field]: value } : group
    )));
  };

  const updateItem = (groupIndex, itemIndex, field, value) => {
    setServices(prev => prev.map((group, i) => {
      if (i !== groupIndex) return group;
      return {
        ...group,
        items: group.items.map((item, j) => (
          j === itemIndex ? { ...item, [field]: value } : item
        )),
      };
    }));
  };

  const addItem = (groupIndex) => {
    setServices(prev => prev.map((group, i) => (
      i === groupIndex
        ? { ...group, items: [...group.items, { name: '', price: '' }] }
        : group
    )));
  };

  const deleteItem = (groupIndex, itemIndex) => {
    setServices(prev => prev.map((group, i) => {
      if (i !== groupIndex) return group;
      return { ...group, items: group.items.filter((_, j) => j !== itemIndex) };
    }));
  };

  const addGroup = () => setServices(prev => [...prev, emptyGroup()]);
  const deleteGroup = (index) => setServices(prev => prev.filter((_, i) => i !== index));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6 }}>
          Эти данные отображаются на странице «Услуги и цены».
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button type="button" onClick={addGroup} style={{ ...btnPrimary, background: '#fff', color: colors.accent, border: `1px solid ${colors.lightBlue}` }}>
            + Категория
          </button>
          <button type="button" onClick={onSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {services.map((group, groupIndex) => (
        <div key={groupIndex} style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: 12, alignItems: 'end', marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Категория</label>
              <input style={inputStyle} value={group.category} onChange={e => updateGroup(groupIndex, 'category', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Цвет</label>
              <input style={{ ...inputStyle, padding: 4, height: 38 }} type="color" value={group.color || '#1a4a8a'} onChange={e => updateGroup(groupIndex, 'color', e.target.value)} />
            </div>
            <button type="button" onClick={() => deleteGroup(groupIndex)} style={btnSm('#c0392b', '#f5c6c6')}>
              Удалить
            </button>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {group.items.map((item, itemIndex) => (
              <div key={itemIndex} style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: 10, alignItems: 'center' }}>
                <input style={inputStyle} value={item.name} placeholder="Название услуги" onChange={e => updateItem(groupIndex, itemIndex, 'name', e.target.value)} />
                <input style={inputStyle} value={item.price} placeholder="Цена" onChange={e => updateItem(groupIndex, itemIndex, 'price', e.target.value)} />
                <button type="button" onClick={() => deleteItem(groupIndex, itemIndex)} style={btnSm('#c0392b', '#f5c6c6')}>
                  Удалить
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={() => addItem(groupIndex)} style={{ ...btnSm(colors.accent, colors.lightBlue), marginTop: 12 }}>
            + Услуга
          </button>
        </div>
      ))}

      {services.length === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center', color: colors.textMuted }}>
          Список пуст. Добавьте категорию и услуги.
        </div>
      )}
    </div>
  );
};

export default AdminServicesManage;
