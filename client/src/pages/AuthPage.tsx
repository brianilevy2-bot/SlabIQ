import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || "",
  import.meta.env.VITE_SUPABASE_ANON_KEY || ""
);

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
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
    <div className="min-h-screen flex items-center justify-center px-4 grid-bg" style={{ background: 'var(--bg-primary)' }}>
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3), transparent 70%)' }} />

      <div className="w-full max-w-sm relative animate-fade-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 mb-5 shadow-lg shadow-blue-500/25">
            <span className="font-bold text-2xl">SQ</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Slab<span className="gradient-text">IQ</span>
          </h1>
          <p className="text-gray-500 text-sm mt-2 tracking-wide">Sports card portfolio intelligence</p>
        </div>

        <div className="glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="input-sleek" placeholder="you@email.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="input-sleek" placeholder="Min 6 characters" />
            </div>

            {error && (
              <div className="text-red-400 text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                {error}
              </div>
            )}
            {message && (
              <div className="text-green-400 text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                {message}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 rounded-xl font-semibold transition shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 mt-2">
              {loading ? "..." : isLogin ? "Log In" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-5">
          {isLogin ? "New to SlabIQ?" : "Already have an account?"}{" "}
          <button onClick={() => { setIsLogin(!isLogin); setError(""); setMessage(""); }}
            className="text-blue-400 hover:text-blue-300 font-medium transition">
            {isLogin ? "Create account" : "Log in"}
          </button>
        </p>

        {!isLogin && (
          <p className="text-center text-[11px] text-gray-700 mt-3 tracking-wide">
            FREE TIER: 20 CARDS • 5 GRADING LOOKUPS/MO
          </p>
        )}
      </div>
    </div>
  );
}