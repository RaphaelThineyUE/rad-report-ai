/**
 * Styled button primitive with variant and size support.
 * Props: variant? ('primary'|'secondary'|'ghost'), size? ('sm'|'md'),
 *   icon? (Icon name string rendered before children), children?, onClick?,
 *   style?, disabled?, type? ('button'|'submit'|'reset').
 * Composes CSS classes: btn, btn-{variant}, btn-sm. Icon size is 15 for sm, 16 otherwise.
 */
import type { MouseEvent } from 'react';
import { Icon } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  variant?: Variant;
  size?: 'sm' | 'md';
  icon?: string;
  children?: React.ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  variant = 'primary',
  size,
  icon,
  children,
  onClick,
  style,
  disabled,
  type = 'button',
}: ButtonProps) {
  const cls = ['btn', `btn-${variant}`, size === 'sm' ? 'btn-sm' : ''].join(' ');
  return (
    <button className={cls} onClick={onClick} style={style} disabled={disabled} type={type}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 16} />}
      {children}
    </button>
  );
}
