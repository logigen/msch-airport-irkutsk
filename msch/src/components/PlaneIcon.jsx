export const PlaneIcon = ({ size = 32, color = 'currentColor', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={style} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M28 12L20 14L14 4H10L14 14L6 16L4 13H2L4 18L2 23H4L6 20L14 22L10 32H14L20 22L28 24C30 24 32 22 32 20C32 18 30 12 28 12Z"
      fill={color}
    />
  </svg>
);

export const PlaneDecor = ({ opacity = 0.12, style = {} }) => (
  <div style={{ position: 'absolute', pointerEvents: 'none', ...style }}>
    <PlaneIcon size={120} color={`rgba(61,111,168,${opacity})`} />
  </div>
);
