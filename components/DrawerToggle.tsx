'use client';

interface DrawerToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function DrawerToggle({ isOpen, onToggle }: DrawerToggleProps) {
  return (
    <button
      type="button"
      className="drawer-toggle"
      onClick={onToggle}
      aria-label={isOpen ? 'おとのへやをとじる' : 'おとのへやをひらく'}
      aria-expanded={isOpen}
    >
      {isOpen ? '✕' : '♫'}
    </button>
  );
}
