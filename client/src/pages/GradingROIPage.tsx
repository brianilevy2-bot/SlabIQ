import { useState } from "react";

interface GradingROIResult {
  verdict: string;
  expected_profit: number;
  psa9_profit: number;
  psa10_profit: number;
  break_even_psa10_rate: number;
  explanation: string;
}

const verdictConfig: Record<string, { color: string; bg: string; border: string }> = {
  "Worth Grading": { color: "var(--green)",  bg: "rgba(62,207,142,0.06)",  border: "rgba(62,207,142,0.25)"  },
  "Risky":         { color: "var(--gold)",   bg: "var(--gold-dim)",         border: "var(--gold-border)"     },
  "Don't Bother":  { color: "var(--red)",    bg: "rgba(255,77,109,0.06)",  border: "rgba(255,77,109,0.25)"  },
};

export default function GradingROIPage() {
  const [rawPrice,    setRawPrice]    = useState("");
  const [psa9Price,   setPsa9Price]   = useState("");
  const [psa10Price,  setPsa10Price]  = useState("");
  const [gradingCost, setGradingCost] = useState("30");
  const [psa10Prob,   setPsa10Prob]   = useState("25");
  const [result,  setResult]  = useState<GradingROIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setResult(null); setLoading(true);
    try {
      const res = await fetch("/api/grading-roi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_price:         parseFloat(rawPrice),
          psa9_price:        parseFloat(psa9Price),
          psa10_price:       parseFloat(psa10Price),
          grading_cost:      parseFloat(gradingCost),
          psa10_probability: parseFloat(psa10Prob),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      setResult(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const vc = result ? (verdictConfig[result.verdict] ?? verdictConfig["Risky"]) : null;

  return (
    <div className="max-w-xl mx-auto animate-fade-up">
      <div className="mb-8">
        <h1 className="serif text-2xl md:text-3xl font-semibold tracking-wide" style={{ color: "var(--text-primary)" }}>
          Grading ROI
        </h1>
        <p className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>
          Should you submit? Run the numbers before you commit.
        </p>
      </div>

      <form onSubmit={handleCalculate} className="space-y-4">
        <div className="rounded-xl p-4 md:p-6 space-y-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            — Market Prices
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Raw",    val: rawPrice,   set: setRawPrice,   ph: "0.00" },
              { label: "PSA 9",  val: psa9Price,  set: setPsa9Price,  ph: "0.00" },
              { label: "PSA 10", val: psa10Price, set: setPsa10Price, ph: "0.00" },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-[10px] uppercase tracking-widest mb-2"
                  style={{ color: "var(--text-muted)" }}>{f.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-sm select-none"
                    style={{ color: "var(--text-muted)" }}>$</span>
                  <input type="number" step="0.01" min="0" value={f.val}
                    onChange={e => f.set(e.target.value)} placeholder={f.ph} required
                    className="input-sleek" style={{ paddingLeft: "1.6rem" }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mono text-[11px]" style={{ color: "var(--text-muted)" }}>
            Pull from eBay sold listings for accuracy.
          </p>
        </div>

        <div className="rounded-xl p-4 md:p-6 space-y-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            — Grading Details
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-2"
                style={{ color: "var(--text-muted)" }}>Grading Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-sm select-none"
                  style={{ color: "var(--text-muted)" }}>$</span>
                <input type="number" step="0.01" min="0" value={gradingCost}
                  onChange={e => setGradingCost(e.target.value)} required
                  className="input-sleek" style={{ paddingLeft: "1.6rem" }} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-2"
                style={{ color: "var(--text-muted)" }}>PSA 10 Chance</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-sm select-none"
                  style={{ color: "var(--text-muted)" }}>%</span>
                <input type="number" min="0" max="100" value={psa10Prob}
                  onChange={e => setPsa10Prob(e.target.value)} required
                  className="input-sleek" style={{ paddingLeft: "1.6rem" }} />
              </div>
            </div>
          </div>
          <p className="mono text-[11px]" style={{ color: "var(--text-muted)" }}>
            Be honest — most cards grade 15–30% PSA 10.
          </p>
        </div>

        {error && (
          <div className="rounded-lg px-4 py-3 text-sm mono"
            style={{ background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.2)", color: "var(--red)" }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="btn-gold w-full py-3 text-sm tracking-widest uppercase">
          {loading ? "Calculating..." : "Calculate ROI"}
        </button>
      </form>

      {result && vc && (
        <div className="mt-6 space-y-3 animate-fade-up">
          <div className="rounded-xl px-6 py-6 text-center"
            style={{ background: vc.bg, border: `1px solid ${vc.border}` }}>
            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
              Verdict
            </p>
            <p className="serif text-2xl md:text-3xl font-semibold" style={{ color: vc.color }}>
              {result.verdict}
            </p>
            <p className="text-sm mt-2" style={{ color: vc.color, opacity: 0.75 }}>
              {result.explanation}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Expected Profit", value: `${result.expected_profit >= 0 ? "+" : ""}$${result.expected_profit.toFixed(2)}`, color: result.expected_profit >= 0 ? "var(--green)" : "var(--red)" },
              { label: "PSA 10 Profit",   value: `+$${result.psa10_profit.toFixed(2)}`,                                            color: "var(--gold)" },
              { label: "PSA 9 Profit",    value: `${result.psa9_profit >= 0 ? "+" : ""}$${result.psa9_profit.toFixed(2)}`,         color: result.psa9_profit >= 0 ? "var(--green)" : "var(--red)" },
              { label: "Break-even Rate", value: `${result.break_even_psa10_rate}% PSA 10`,                                        color: "var(--text-primary)" },
            ].map(m => (
              <div key={m.label} className="rounded-xl px-4 py-4"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                  {m.label}
                </p>
                <p className="mono text-lg md:text-xl font-medium" style={{ color: m.color }}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
