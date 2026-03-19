import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || "",
  import.meta.env.VITE_SUPABASE_ANON_KEY || ""
);

export default function AuthPage() {
  const [isLogin, setIsLogin]   = useState(true);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [message, setMessage]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage(""); setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email for a confirmation link.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 grid-bg"
      style={{ background: "var(--bg-primary)" }}
    >
      <div style={{
        position: "fixed", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
        width: 480, height: 480, borderRadius: "50%", pointerEvents: "none",
        background: "radial-gradient(circle, rgba(201,168,76,0.07), transparent 70%)",
        filter: "blur(40px)",
      }} />

      <div className="w-full max-w-sm relative animate-fade-up">

        <div className="text-center mb-10">
          <div style={{
            width: 48, height: 48, borderRadius: 14, margin: "0 auto 16px",
            background: "linear-gradient(145deg, var(--gold), var(--gold-light))",
            boxShadow: "var(--shadow-gold)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "'Inter Tight', monospace", fontSize: 13, fontWeight: 600, color: "#180E00" }}>SQ</span>
          </div>
          <h1 style={{
            fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 700,
            letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 6,
          }}>
            Slab<span className="gold-text">IQ</span>
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "'Sora', sans-serif" }}>
            Sports card portfolio intelligence
          </p>
        </div>

        <div style={{
          display: "flex", background: "var(--bg-subtle)", borderRadius: 99,
          padding: 3, border: "1px solid var(--border-subtle)", gap: 2, marginBottom: 20,
        }}>
          {["Log In", "Sign Up"].map((label) => {
            const active = label === "Log In" ? isLogin : !isLogin;
            return (
              <button key={label} onClick={() => { setIsLogin(label === "Log In"); setError(""); setMessage(""); }}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 99, border: "none", cursor: "pointer",
                  fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 600,
                  background: active ? "var(--bg-raised)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: active ? "var(--shadow)" : "none",
                  transition: "all 0.15s",
                }}>{label}</button>
            );
          })}
        </div>

        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          borderRadius: 20, padding: 24,
          boxShadow: "var(--shadow), var(--inner-glow)",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{
                display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.11em",
                color: "var(--text-muted)", marginBottom: 7, textTransform: "uppercase",
                fontFamily: "'Sora', sans-serif",
              }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="you@email.com" className="input-sleek" />
            </div>
            <div>
              <label style={{
                display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.11em",
                color: "var(--text-muted)", marginBottom: 7, textTransform: "uppercase",
                fontFamily: "'Sora', sans-serif",
              }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                required minLength={6} placeholder="Min 6 characters" className="input-sleek" />
            </div>

            {error && (
              <div style={{
                fontSize: 13, borderRadius: 10, padding: "10px 14px",
                background: "var(--red-dim)", border: "1px solid var(--red-border)",
                color: "var(--red)", fontFamily: "'Sora', sans-serif",
              }}>{error}</div>
            )}
            {message && (
              <div style={{
                fontSize: 13, borderRadius: 10, padding: "10px 14px",
                background: "var(--green-dim)", border: "1px solid var(--green-border)",
                color: "var(--green)", fontFamily: "'Sora', sans-serif",
              }}>{message}</div>
            )}

            <button type="submit" disabled={loading} className="btn-gold"
              style={{ width: "100%", padding: "12px 0", fontSize: 13.5, marginTop: 4 }}>
              {loading ? "..." : isLogin ? "Log In" : "Create Account"}
            </button>
          </form>
        </div>

        {!isLogin && (
          <p style={{
            textAlign: "center", fontSize: 11, color: "var(--text-muted)",
            marginTop: 16, letterSpacing: "0.10em", fontFamily: "'Inter Tight', monospace",
          }}>
            FREE TIER · 20 CARDS · 5 GRADING LOOKUPS/MO
          </p>
        )}
      </div>
    </div>
  );
}