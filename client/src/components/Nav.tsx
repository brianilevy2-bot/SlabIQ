import { useState } from "react";

const tabs = [
  { path: "/",        label: "Portfolio", icon: "◈" },
  { path: "/grading", label: "Grade ROI", icon: "◉" },
  { path: "/sets",    label: "Sets",      icon: "◫" },
];

interface NavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

function ThemeIcon({ darkMode }: { darkMode: boolean }) {
  if (darkMode) {
    // Sun icon
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    );
  }
  // Moon icon
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function Nav({ currentPath, onNavigate, onLogout, darkMode, onToggleTheme }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-50"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--nav-bg)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          {/* Logo */}
          <button onClick={() => { onNavigate("/"); setMenuOpen(false); }}
            className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="serif font-bold text-[22px] tracking-wide" style={{ lineHeight: 1 }}>
              Slab<span className="gold-text">IQ</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {tabs.map((tab) => {
              const active = currentPath === tab.path;
              return (
                <button key={tab.path} onClick={() => onNavigate(tab.path)}
                  className="relative px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                  style={{
                    color: active ? "var(--gold)" : "var(--text-muted)",
                    background: active ? "var(--gold-dim)" : "transparent",
                    border: active ? "1px solid var(--gold-border)" : "1px solid transparent",
                  }}>
                  <span className="text-xs mr-1.5 opacity-50">{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onToggleTheme}
              className="w-8 h-8 rounded-md flex items-center justify-center transition"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--gold)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              <ThemeIcon darkMode={darkMode} />
            </button>
<button onClick={onLogout}
              className="text-[11px] uppercase tracking-widest transition"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-secondary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
              Logout
            </button>
          </div>

          {/* Mobile right */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="w-8 h-8 rounded-md flex items-center justify-center transition"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
              }}
            >
              <ThemeIcon darkMode={darkMode} />
            </button>
<button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-md transition"
              style={{ color: "var(--text-muted)" }}
            >
              <span className="w-5 h-px block" style={{ background: "currentColor" }} />
              <span className="w-5 h-px block" style={{ background: "currentColor" }} />
              <span className="w-5 h-px block" style={{ background: "currentColor" }} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden px-4 pb-4 space-y-1"
            style={{ borderTop: "1px solid var(--border-subtle)" }}>
            {tabs.map((tab) => {
              const active = currentPath === tab.path;
              return (
                <button key={tab.path}
                  onClick={() => { onNavigate(tab.path); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition"
                  style={{
                    color: active ? "var(--gold)" : "var(--text-secondary)",
                    background: active ? "var(--gold-dim)" : "transparent",
                    border: active ? "1px solid var(--gold-border)" : "1px solid transparent",
                  }}>
                  <span className="mr-2 opacity-50">{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
            <button onClick={() => { onLogout(); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm transition"
              style={{ color: "var(--text-muted)" }}>
              Logout
            </button>
          </div>
        )}
      </header>
    </>
  );
}
