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
