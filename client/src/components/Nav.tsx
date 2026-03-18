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
}

export default function Nav({ currentPath, onNavigate, onLogout }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-50"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(8,8,8,0.92)",
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
            <button className="btn-gold text-[11px] px-3 py-1.5 tracking-widest uppercase">
              Upgrade Pro
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
            <button className="btn-gold text-[10px] px-2.5 py-1.5 tracking-widest uppercase">
              Pro
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
          <div
            className="md:hidden px-4 pb-4 space-y-1"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
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
