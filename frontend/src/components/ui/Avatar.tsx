/**
 * Circular avatar displaying up to two initials.
 * Props: initials (string), size? (number, default 38).
 * Styled via the global .avatar CSS class; font size scales at 36% of the
 * container size. Renders a plain div — no image fallback.
 */
interface AvatarProps {
  initials: string;
  size?: number;
}

export function Avatar({ initials, size = 38 }: AvatarProps) {
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}
