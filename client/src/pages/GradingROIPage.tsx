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

const TOOLTIPS: Record<string, string> = {
  "Raw":           "The price this card sells for ungraded on eBay sold listings.",
  "PSA 9":         "What this card sells for with a PSA 9 grade. Check eBay sold listings filtered to PSA 9.",
  "PSA 10":        "What this card sells for with a PSA 10 grade — the top grade and biggest price jump.",
  "Grading Cost":  "Total cost to submit: PSA fee + shipping both ways. PSA Economy is ~$25–50 depending on value.",
  "PSA 10 Chance": "Your honest estimate that this card grades a 10. Most raw cards land 15–30%. Be conservative.",
};

function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        style={{
          width: 14, height: 14, borderRadius: "50%", border: "1px solid var(--border-mid)",
          background: "var(--bg-subtle)", color: "var(--text-muted)", cursor: "default",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700, fontFamily: "serif", lineHeight: 1,
          flexShrink: 0, outline: "none", padding: 0,
        }}
      >i</button>
      {visible && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
          transform: "translateX(-50%)", zIndex: 100,
          background: "var(--bg-raised)", border: "1px solid var(--border-mid)",
          borderRadius: 8, padding: "8px 10px", width: 200,
          boxShadow: "var(--shadow-raised)",
          fontSize: 11, color: "var(--text-secondary)",
          fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.5,
          pointerEvents: "none",
        }}>
          {text}
          {/* Arrow */}
          <div style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
            borderTop: "5px solid var(--border-mid)",
          }} />
        </div>
      )}
    </div>
  );
}

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
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 6 }}>
          Grading ROI
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Should you submit? Run the numbers before you commit.
        </p>
      </div>

      <form onSubmit={handleCalculate} className="space-y-4">
        <div className="rounded-xl p-4 md:p-6 space-y-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Market Prices
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Raw",    val: rawPrice,   set: setRawPrice,   ph: "0.00" },
              { label: "PSA 9",  val: psa9Price,  set: setPsa9Price,  ph: "0.00" },
              { label: "PSA 10", val: psa10Price, set: setPsa10Price, ph: "0.00" },
            ].map(f => (
              <div key={f.label}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {f.label}
                  </label>
                  <InfoTooltip text={TOOLTIPS[f.label]} />
                </div>
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
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Grading Details
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Grading Cost
                </label>
                <InfoTooltip text={TOOLTIPS["Grading Cost"]} />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-sm select-none"
                  style={{ color: "var(--text-muted)" }}>$</span>
                <input type="number" step="0.01" min="0" value={gradingCost}
                  onChange={e => setGradingCost(e.target.value)} required
                  className="input-sleek" style={{ paddingLeft: "1.6rem" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  PSA 10 Chance
                </label>
                <InfoTooltip text={TOOLTIPS["PSA 10 Chance"]} />
              </div>
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

        <button type="submit" disabled={loading} className="btn-gold w-full py-3 text-sm">
          {loading ? "Calculating..." : "Calculate ROI"}
        </button>
      </form>

      {result && vc && (
        <div className="mt-6 space-y-3 animate-fade-up">
          <div className="rounded-xl px-6 py-6 text-center"
            style={{ background: vc.bg, border: `1px solid ${vc.border}` }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Verdict
            </p>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: vc.color }}>
              {result.verdict}
            </p>
            <p style={{ fontSize: 13, marginTop: 6, color: vc.color, opacity: 0.75, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>
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