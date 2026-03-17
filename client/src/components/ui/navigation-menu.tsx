const tabs = [
  { path: "/", label: "Portfolio" },
  { path: "/grading", label: "Grade ROI" },
  { path: "/sets", label: "Sets" },
];

interface NavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export default function Nav({ currentPath, onNavigate, onLogout }: NavProps) {
  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <button onClick={() => onNavigate("/")} className="flex items-center gap-2 hover:opacity-80 transition">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">SQ</div>
          <span className="font-bold text-lg">Slab<span className="text-blue-400">IQ</span></span>
        </button>
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.path}
              onClick={() => onNavigate(tab.path)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                currentPath === tab.path
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <button onClick={onLogout} className="text-sm text-gray-500 hover:text-gray-300 transition">
          Log out
        </button>
      </div>
    </header>
  );
}