import { useState, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import AuthPage from "./pages/AuthPage";
import PortfolioPage from "./pages/PortfolioPage";
import GradingROIPage from "./pages/GradingROIPage";
import SetsPage from "./pages/SetsPage";
import Nav from "./components/Nav";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || "",
  import.meta.env.VITE_SUPABASE_ANON_KEY || ""
);

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("slabiq-theme") !== "light";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("slabiq-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("slabiq-theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg"
        style={{ background: "var(--bg-primary)" }}>
        <div className="text-center">
          <span className="serif gold-text font-semibold tracking-widest" style={{ fontSize: "28px" }}>
            SlabIQ
          </span>
          <div className="mt-3 mx-auto h-px w-16"
            style={{
              background: "linear-gradient(90deg, transparent, var(--gold), transparent)",
              animation: "shimmer 1.8s ease-in-out infinite",
              backgroundSize: "200% auto",
            }}
          />
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen flex flex-col grid-bg" style={{ background: "var(--bg-primary)" }}>
      <Nav
        currentPath={location}
        onNavigate={setLocation}
        onLogout={async () => { await supabase.auth.signOut(); }}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(d => !d)}
      />
      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-8">
        <Switch>
          <Route path="/" component={PortfolioPage} />
          <Route path="/grading" component={GradingROIPage} />
          <Route path="/sets" component={SetsPage} />
          <Route>
            <div className="text-center py-20 mono text-sm" style={{ color: "var(--text-muted)" }}>
              Page not found
            </div>
          </Route>
        </Switch>
      </main>
    </div>
  );
}
