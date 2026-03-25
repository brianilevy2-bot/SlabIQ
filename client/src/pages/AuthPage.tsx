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
        width: 500, height: 500, borderRadius: "50%", pointerEvents: "none",
        background: "radial-gradient(circle, rgba(201,168,76,0.06), transparent 70%)",
        filter: "blur(60px)",
      }} />

      <div className="w-full animate-fade-up" style={{ maxWidth: 360, position: "relative" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, margin: "0 auto 12px",
            background: "linear-gradient(145deg, var(--gold), var(--gold-light))",
            boxShadow: "var(--shadow-gold)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "'Inter Tight', monospace", fontSize: 12, fontWeight: 600, color: "#180E00" }}>SQ</span>
          </div>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700,
            letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 6,
          }}>
            Slab<span className="gold-text">IQ</span>
          </h1>
          <p style={{
            fontSize: 13, color: "var(--text-secondary)",
            fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.5,
          }}>
            Know exactly what your portfolio is worth.
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          borderRadius: 16, overflow: "hidden",
          boxShadow: "var(--shadow), var(--inner-glow)",
        }}>
          {/* Tab toggle */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            borderBottom: "1px solid var(--border-subtle)",
          }}>
            {["Log In", "Sign Up"].map((label) => {
              const active = label === "Log In" ? isLogin : !isLogin;
              return (
                <button key={label}
                  onClick={() => { setIsLogin(label === "Log In"); setError(""); setMessage(""); }}
                  style={{
                    padding: "12px 0", border: "none", cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600,
                    background: active ? "var(--bg-card)" : "var(--bg-subtle)",
                    color: active ? "var(--text-primary)" : "var(--text-muted)",
                    borderBottom: active ? `2px solid var(--gold)` : "2px solid transparent",
                    transition: "all 0.15s",
                  }}>{label}</button>
              );
            })}
          </div>

          <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 600,
                  color: "var(--text-muted)", marginBottom: 6,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="you@email.com" className="input-sleek" />
              </div>
              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 600,
                  color: "var(--text-muted)", marginBottom: 6,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required minLength={6} placeholder="Min 6 characters" className="input-sleek" />
              </div>

              {error && (
                <div style={{
                  fontSize: 13, borderRadius: 8, padding: "10px 14px",
                  background: "var(--red-dim)", border: "1px solid var(--red-border)",
                  color: "var(--red)", fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>{error}</div>
              )}
              {message && (
                <div style={{
                  fontSize: 13, borderRadius: 8, padding: "10px 14px",
                  background: "var(--green-dim)", border: "1px solid var(--green-border)",
                  color: "var(--green)", fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>{message}</div>
              )}

              <button type="submit" disabled={loading} className="btn-gold"
                style={{ width: "100%", padding: "12px 0", fontSize: 13.5, marginTop: 2 }}>
                {loading ? "..." : isLogin ? "Log In" : "Create Free Account"}
              </button>
            </form>

            {!isLogin && (
              <p style={{
                textAlign: "center", fontSize: 11, color: "var(--text-muted)",
                fontFamily: "'Inter Tight', monospace", letterSpacing: "0.06em",
              }}>
                Free · 20 cards · 5 grading lookups/mo
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}