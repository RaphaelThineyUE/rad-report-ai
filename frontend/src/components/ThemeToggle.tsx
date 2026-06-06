import { useTheme } from '@/contexts/ThemeContext';
import { Icon } from '@/components/ui';

export function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme();

  const handleToggle = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <button
      onClick={handleToggle}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 8,
        borderRadius: 'var(--r-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 200ms ease',
        color: 'var(--fg-1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <Icon
        name={isDark ? 'sun' : 'moon'}
        size={20}
        style={{
          transition: 'transform 200ms ease',
        }}
      />
    </button>
  );
}
