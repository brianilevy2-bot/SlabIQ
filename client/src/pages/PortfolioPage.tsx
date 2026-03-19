import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import AddCardModal from "../components/AddCardModal";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || "",
  import.meta.env.VITE_SUPABASE_ANON_KEY || ""
);

const FREE_CARD_LIMIT = 20;

interface PortfolioCard {
  id: string;
  player: string;
  year: string;
  set_name: string;
  card_number: string;
  variation: string;
  grade: string;
  price_paid: number;
  current_value: number | null;
  notes: string;
  created_at: string;
}

interface NewCard {
  player: string;
  year: string;
  set_name: string;
  card_number: string;
  variation: string;
  grade: string;
  price_paid: number;
  current_value: number | null;
  notes: string;
}

function getGradeBadgeClass(grade: string) {
  if (grade === "Raw") return "grade-raw";
  if (grade.includes("10")) return "grade-gold";
  if (grade.includes("9.5") || grade.includes("9")) return "grade-blue";
  return "grade-green";
}

export default function PortfolioPage() {
  const [cards, setCards] = useState<PortfolioCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCard, setEditingCard] = useState<PortfolioCard | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const isAtLimit = cards.length >= FREE_CARD_LIMIT;

  useEffect(() => { fetchCards(); }, []);

  async function fetchCards() {
    setLoading(true);
    const { data, error } = await supabase
      .from("portfolio_cards").select("*").order("created_at", { ascending: false });
    if (error) console.error(error);
    else setCards(data || []);
    setLoading(false);
  }

  async function addCard(card: NewCard) {
    if (isAtLimit) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("portfolio_cards").insert({ ...card, user_id: user.id });
    if (error) { console.error(error); return; }
    setShowAddModal(false);
    fetchCards();
  }

  async function updateCard(id: string, card: NewCard) {
    const { error } = await supabase.from("portfolio_cards").update(card).eq("id", id);
    if (error) { console.error(error); return; }
    setEditingCard(null);
    fetchCards();
  }

  async function deleteCard(id: string) {
    const { error } = await supabase.from("portfolio_cards").delete().eq("id", id);
    if (error) { console.error(error); return; }
    fetchCards();
  }

  const totalPaid  = cards.reduce((s, c) => s + Number(c.price_paid), 0);
  const hasValues  = cards.some(c => c.current_value != null);
  const totalValue = cards.reduce((s, c) => s + (c.current_value ? Number(c.current_value) : 0), 0);
  const totalPL    = hasValues ? totalValue - totalPaid : null;
  const avgCost    = cards.length > 0 ? totalPaid / cards.length : 0;
  const plPositive = totalPL != null && totalPL >= 0;

  const gradeBreakdown: Record<string, number> = {};
  cards.forEach(c => { const g = c.grade || "Raw"; gradeBreakdown[g] = (gradeBreakdown[g] || 0) + 1; });
  const sortedGrades = Object.entries(gradeBreakdown).sort((a, b) => b[1] - a[1]);
  const topCards = [...cards].sort((a, b) => Number(b.price_paid) - Number(a.price_paid)).slice(0, 3);

  return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Header ───────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 700,
            letterSpacing: "-0.03em", color: "var(--text-primary)", lineHeight: 1, marginBottom: 6,
          }}>My Portfolio</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontFamily: "'Inter Tight', monospace", fontSize: 12,
              color: "var(--text-secondary)",
            }}>{cards.length} / {FREE_CARD_LIMIT} cards</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text-muted)", display: "inline-block" }} />
            <span style={{
              fontFamily: "'Inter Tight', monospace", fontSize: 12, color: "var(--text-muted)",
            }}>Free tier</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            display: "flex", background: "var(--bg-subtle)", borderRadius: 8,
            padding: 2, border: "1px solid var(--border-subtle)", gap: 1,
          }}>
            {(["grid", "list"] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 500,
                background: viewMode === v ? "var(--bg-raised)" : "transparent",
                color: viewMode === v ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: viewMode === v ? "var(--shadow)" : "none",
                transition: "all 0.15s", textTransform: "capitalize",
              }}>{v}</button>
            ))}
          </div>
          <button onClick={() => setShowAddModal(true)} disabled={isAtLimit} className="btn-gold"
            style={{ padding: "8px 18px", fontSize: 13 }}>
            + Add Card
          </button>
        </div>
      </div>

      {/* ── KPI Row ───────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          borderRadius: 12, padding: "16px 18px", boxShadow: "var(--shadow)",
        }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>Total Invested</p>
          <p style={{ fontFamily: "'Inter Tight', monospace", fontSize: 20, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>${totalPaid.toFixed(2)}</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontFamily: "'Inter Tight', monospace" }}>{cards.length} cards</p>
        </div>

        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          borderRadius: 12, padding: "16px 18px", boxShadow: "var(--shadow)",
        }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>Current Value</p>
          <p style={{ fontFamily: "'Inter Tight', monospace", fontSize: 20, fontWeight: 600, color: "var(--gold)", letterSpacing: "-0.02em" }}>{hasValues ? `$${totalValue.toFixed(2)}` : "—"}</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontFamily: "'Inter Tight', monospace" }}>{hasValues ? "tracked value" : "add values to track"}</p>
        </div>

        <div style={{
          background: totalPL != null ? plPositive ? "rgba(46,204,138,0.06)" : "rgba(232,80,106,0.06)" : "var(--bg-card)",
          border: `1px solid ${totalPL != null ? plPositive ? "var(--green-border)" : "var(--red-border)" : "var(--border-subtle)"}`,
          borderRadius: 12, padding: "16px 18px", boxShadow: "var(--shadow)",
        }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>P&L</p>
          <p style={{ fontFamily: "'Inter Tight', monospace", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: totalPL != null ? plPositive ? "var(--green)" : "var(--red)" : "var(--text-muted)" }}>
            {totalPL != null ? `${plPositive ? "+" : ""}$${Math.abs(totalPL).toFixed(2)}` : "—"}
          </p>
          <p style={{ fontSize: 11, marginTop: 4, fontFamily: "'Inter Tight', monospace", color: totalPL != null ? plPositive ? "var(--green)" : "var(--red)" : "var(--text-muted)", opacity: 0.7 }}>
            {totalPL != null ? plPositive ? "unrealized gain" : "unrealized loss" : "no values yet"}
          </p>
        </div>

        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          borderRadius: 12, padding: "16px 18px", boxShadow: "var(--shadow)",
        }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}>Avg Cost</p>
          <p style={{ fontFamily: "'Inter Tight', monospace", fontSize: 20, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>${avgCost.toFixed(2)}</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontFamily: "'Inter Tight', monospace" }}>per card</p>
        </div>
      </div>

      {/* ── Grade Breakdown + Top Holdings ───────────────── */}
      {cards.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "18px 20px", boxShadow: "var(--shadow)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Grade Breakdown</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sortedGrades.map(([grade, count]) => {
                const pct = (count / cards.length) * 100;
                return (
                  <div key={grade}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "center" }}>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{grade}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "'Inter Tight', monospace", fontSize: 11, color: "var(--text-muted)" }}>{count} card{count !== 1 ? "s" : ""}</span>
                        <span style={{ fontFamily: "'Inter Tight', monospace", fontSize: 11, color: "var(--text-secondary)", minWidth: 32, textAlign: "right" }}>{Math.round(pct)}%</span>
                      </div>
                    </div>
                    <div style={{ height: 4, background: "var(--bg-subtle)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 99, width: `${pct}%`, transition: "width 0.5s",
                        background: grade === "Raw" ? "var(--border-mid)" : grade.includes("10") ? "linear-gradient(90deg, var(--amber), var(--gold))" : "var(--blue)",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "18px 20px", boxShadow: "var(--shadow)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Top Holdings</p>
            {topCards.map((card, i) => {
              const pl = card.current_value != null ? Number(card.current_value) - Number(card.price_paid) : null;
              const rankColors = ["var(--gold)", "var(--text-secondary)", "var(--text-muted)"];
              return (
                <div key={card.id} style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: i < topCards.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <span style={{ fontFamily: "'Inter Tight', monospace", fontSize: 11, fontWeight: 600, color: rankColors[i], width: 16, flexShrink: 0, textAlign: "center" }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.player}</p>
                    <p style={{ fontFamily: "'Inter Tight', monospace", fontSize: 11, color: "var(--text-muted)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.year} · {card.set_name}</p>
                  </div>
                  <span className={`grade-badge ${getGradeBadgeClass(card.grade)}`} style={{ flexShrink: 0 }}>{card.grade}</span>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontFamily: "'Inter Tight', monospace", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>${Number(card.price_paid).toFixed(2)}</p>
                    {pl != null && <p style={{ fontFamily: "'Inter Tight', monospace", fontSize: 11, color: pl >= 0 ? "var(--green)" : "var(--red)", marginTop: 1 }}>{pl >= 0 ? "+" : ""}${pl.toFixed(2)}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Limit Banner ──────────────────────────────────── */}
      {isAtLimit && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", borderRadius: 10, background: "var(--gold-dim)", border: "1px solid var(--gold-border)" }}>
          <span style={{ fontSize: 13, color: "var(--gold)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>You've reached the 20-card free limit.</span>
          <button className="btn-gold" style={{ padding: "6px 14px", fontSize: 12, flexShrink: 0 }}>Upgrade to Pro — $4.99/mo</button>
        </div>
      )}

      {/* ── Divider ───────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Collection</span>
        <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
      </div>

      {/* ── Collection ───────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", fontFamily: "'Inter Tight', monospace", fontSize: 13, color: "var(--text-muted)" }}>Loading...</div>
      ) : cards.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", borderRadius: 12, border: "1px dashed var(--border-mid)", background: "var(--gold-dim)" }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Start your collection</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Add your first card to begin tracking</p>
          <button onClick={() => setShowAddModal(true)} className="btn-gold" style={{ padding: "10px 24px", fontSize: 13 }}>+ Add First Card</button>
        </div>
      ) : viewMode === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
          {cards.map((card) => {
            const pl = card.current_value != null ? Number(card.current_value) - Number(card.price_paid) : null;
            return (
              <div key={card.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 10, overflow: "hidden", position: "relative", cursor: "default", transition: "border-color 0.15s, box-shadow 0.15s", boxShadow: "var(--shadow)" }}
                className="group"
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-mid)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-subtle)"; }}
              >
                <div style={{ height: 3, width: "100%", background: card.grade === "Raw" ? "var(--border-mid)" : card.grade.includes("10") ? "linear-gradient(90deg, var(--amber), var(--gold))" : "var(--blue)" }} />
                <div style={{ padding: "12px 13px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6, marginBottom: 6 }}>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{card.player}</p>
                    <span className={`grade-badge ${getGradeBadgeClass(card.grade)}`} style={{ flexShrink: 0 }}>{card.grade}</span>
                  </div>
                  <p style={{ fontFamily: "'Inter Tight', monospace", fontSize: 11, color: "var(--text-muted)", marginBottom: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {card.year} {card.set_name}{card.card_number ? ` #${card.card_number}` : ""}{card.variation ? ` · ${card.variation}` : ""}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontFamily: "'Inter Tight', monospace", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>${Number(card.price_paid).toFixed(2)}</p>
                    {pl != null && <p style={{ fontFamily: "'Inter Tight', monospace", fontSize: 11, color: pl >= 0 ? "var(--green)" : "var(--red)" }}>{pl >= 0 ? "+" : ""}${pl.toFixed(2)}</p>}
                  </div>
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2"
                  style={{ background: "rgba(7,16,31,0.88)", backdropFilter: "blur(4px)" }}>
                  <button onClick={() => setEditingCard(card)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", background: "var(--gold-dim)", color: "var(--gold)", border: "1px solid var(--gold-border)" }}>Edit</button>
                  <button onClick={() => { if (confirm("Remove this card?")) deleteCard(card.id); }} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", background: "var(--red-dim)", color: "var(--red)", border: "1px solid var(--red-border)" }}>Delete</button>
                </div>
              </div>
            );
          })}
          <button onClick={() => setShowAddModal(true)} style={{ borderRadius: 10, border: "1px dashed var(--border-mid)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "32px 0", transition: "all 0.15s", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--gold)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-mid)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.05em" }}>Add Card</span>
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {cards.map((card) => {
            const pl = card.current_value != null ? Number(card.current_value) - Number(card.price_paid) : null;
            return (
              <div key={card.id} className="group" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border-subtle)", transition: "border-color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-mid)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
              >
                <div style={{ width: 3, alignSelf: "stretch", borderRadius: 99, flexShrink: 0, background: card.grade === "Raw" ? "var(--border-mid)" : card.grade.includes("10") ? "linear-gradient(180deg, var(--gold), var(--amber))" : "var(--blue)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.player}</p>
                  <p style={{ fontFamily: "'Inter Tight', monospace", fontSize: 11, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.year} {card.set_name}{card.card_number ? ` #${card.card_number}` : ""}</p>
                </div>
                <span className={`grade-badge ${getGradeBadgeClass(card.grade)}`} style={{ flexShrink: 0 }}>{card.grade}</span>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontFamily: "'Inter Tight', monospace", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>${Number(card.price_paid).toFixed(2)}</p>
                  <p style={{ fontFamily: "'Inter Tight', monospace", fontSize: 11, marginTop: 1, color: pl != null ? pl >= 0 ? "var(--green)" : "var(--red)" : "var(--text-muted)" }}>{pl != null ? `${pl >= 0 ? "+" : ""}$${pl.toFixed(2)}` : "—"}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition" style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => setEditingCard(card)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, background: "var(--gold-dim)", color: "var(--gold)", border: "1px solid var(--gold-border)" }}>Edit</button>
                  <button onClick={() => { if (confirm("Remove this card?")) deleteCard(card.id); }} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, background: "var(--red-dim)", color: "var(--red)", border: "1px solid var(--red-border)" }}>Del</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(showAddModal || editingCard) && (
        <AddCardModal
          card={editingCard || undefined}
          onSave={(card) => { if (editingCard) updateCard(editingCard.id, card); else addCard(card); }}
          onClose={() => { setShowAddModal(false); setEditingCard(null); }}
        />
      )}
    </div>
  );
}