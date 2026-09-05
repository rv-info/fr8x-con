import React from 'react';

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  fontSize?: string;
}

export function UserAvatar({
  avatarUrl,
  name = 'User',
  size = 32,
  className = '',
  style = {},
  fontSize,
}: UserAvatarProps) {
  const sizePx = typeof size === 'number' ? `${size}px` : size;
  const computedFontSize =
    fontSize || (typeof size === 'number' ? `${Math.max(10, Math.floor(size * 0.38))}px` : '12px');

  const initials =
    (name || 'U')
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'U';

  const [hasError, setHasError] = React.useState(false);

  // Reset error state if avatarUrl changes
  React.useEffect(() => {
    setHasError(false);
  }, [avatarUrl]);

  if (avatarUrl && avatarUrl.trim() && !hasError) {
    return (
      <div
        className={`user-avatar-wrap ${className}`}
        style={{
          width: sizePx,
          height: sizePx,
          minWidth: sizePx,
          minHeight: sizePx,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: '#f1f5f9',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          ...style,
        }}
      >
        <img
          src={avatarUrl}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`user-avatar-initials ${className}`}
      style={{
        width: sizePx,
        height: sizePx,
        minWidth: sizePx,
        minHeight: sizePx,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: 'linear-gradient(135deg, #1168d7, #099889)',
        color: '#ffffff',
        fontWeight: 800,
        fontSize: computedFontSize,
        letterSpacing: '0.02em',
        userSelect: 'none',
        ...style,
      }}
    >
      {initials}
    </div>
  );
}
