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
  return (
    <header
      className="sticky top-0 z-50"
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(8,8,8,0.92)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-14">
        {/* Logo */}
        <button
          onClick={() => onNavigate("/")}
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <span
            className="serif font-bold text-[22px] tracking-wide"
            style={{ lineHeight: 1 }}
          >
            Slab<span className="gold-text">IQ</span>
          </span>
        </button>

        {/* Nav tabs */}
        <nav className="flex items-center gap-0.5">
          {tabs.map((tab) => {
            const active = currentPath === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => onNavigate(tab.path)}
                className="relative px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                style={{
                  color: active ? "var(--gold)" : "var(--text-muted)",
                  background: active ? "var(--gold-dim)" : "transparent",
                  border: active ? "1px solid var(--gold-border)" : "1px solid transparent",
                }}
              >
                <span className="text-xs mr-1.5 opacity-50">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button
            className="btn-gold text-[11px] px-3 py-1.5 tracking-widest uppercase"
            style={{ fontSize: "11px" }}
          >
            Upgrade Pro
          </button>
          <button
            onClick={onLogout}
            className="text-[11px] uppercase tracking-widest transition"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-secondary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}