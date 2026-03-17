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
  if (grade.includes("10"))  return "grade-gold";
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
      .from("portfolio_cards")
      .select("*")
      .order("created_at", { ascending: false });
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

  const totalPaid    = cards.reduce((s, c) => s + Number(c.price_paid), 0);
  const hasValues    = cards.some(c => c.current_value != null);
  const totalValue   = cards.reduce((s, c) => s + (c.current_value ? Number(c.current_value) : 0), 0);
  const totalPL      = hasValues ? totalValue - totalPaid : null;
  const avgCost      = cards.length > 0 ? totalPaid / cards.length : 0;

  const gradeBreakdown: Record<string, number> = {};
  cards.forEach(c => { const g = c.grade || "Raw"; gradeBreakdown[g] = (gradeBreakdown[g] || 0) + 1; });
  const sortedGrades = Object.entries(gradeBreakdown).sort((a, b) => b[1] - a[1]);
  const topCards = [...cards].sort((a, b) => Number(b.price_paid) - Number(a.price_paid)).slice(0, 3);

  const plPositive = totalPL != null && totalPL >= 0;

  return (
    <div className="space-y-6 animate-fade-up">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="serif text-3xl font-semibold tracking-wide" style={{ color: "var(--text-primary)" }}>
            My Portfolio
          </h1>
          <p className="mono text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {cards.length} / {FREE_CARD_LIMIT} free slots
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div
            className="flex rounded-md p-0.5 gap-0.5"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            {(["grid", "list"] as const).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className="px-3 py-1 rounded text-xs font-medium transition capitalize"
                style={{
                  background: viewMode === v ? "var(--gold-dim)" : "transparent",
                  color:      viewMode === v ? "var(--gold)"     : "var(--text-muted)",
                  border:     viewMode === v ? "1px solid var(--gold-border)" : "1px solid transparent",
                }}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            disabled={isAtLimit}
            className="btn-gold px-4 py-2 text-sm"
          >
            + Add Card
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Invested", value: `$${totalPaid.toFixed(2)}`,  sub: `${cards.length} cards`,                           accent: false },
          { label: "Current Value",  value: hasValues ? `$${totalValue.toFixed(2)}` : "—", sub: hasValues ? "tracked value" : "add values to cards", accent: true  },
          {
            label: "P&L",
            value: totalPL != null ? `${plPositive ? "+" : ""}$${Math.abs(totalPL).toFixed(2)}` : "—",
            sub:   totalPL != null ? (plPositive ? "unrealized gain" : "unrealized loss") : "no values yet",
            accent: false,
            plColor: totalPL != null ? (plPositive ? "var(--green)" : "var(--red)") : undefined,
          },
          { label: "Avg Card Cost",  value: `$${avgCost.toFixed(2)}`,    sub: "per card",                                          accent: false },
        ].map((stat, i) => (
          <div key={i} className="glass-card px-4 py-4">
            <p
              className="text-[10px] uppercase tracking-widest mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              {stat.label}
            </p>
            <p
              className="mono text-xl font-medium"
              style={{ color: stat.plColor ?? (stat.accent ? "var(--gold)" : "var(--text-primary)") }}
            >
              {stat.value}
            </p>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Grade breakdown + Top holdings ── */}
      {cards.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Grade breakdown */}
          <div className="glass-card p-5">
            <p className="text-[10px] uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
              — Grade Breakdown
            </p>
            <div className="space-y-3">
              {sortedGrades.map(([grade, count]) => (
                <div key={grade} className="flex items-center gap-3">
                  <span className={`grade-badge ${getGradeBadgeClass(grade)} w-16 justify-center shrink-0`}>
                    {grade}
                  </span>
                  <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(count / cards.length) * 100}%`,
                        background: grade === "Raw"
                          ? "rgba(100,80,50,0.6)"
                          : "linear-gradient(90deg, var(--amber), var(--gold))",
                      }}
                    />
                  </div>
                  <span className="mono text-xs w-5 text-right" style={{ color: "var(--text-muted)" }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top holdings */}
          <div className="glass-card p-5">
            <p className="text-[10px] uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
              — Top Holdings
            </p>
            <div className="space-y-0">
              {topCards.map((card, i) => {
                const pl = card.current_value != null
                  ? Number(card.current_value) - Number(card.price_paid)
                  : null;
                return (
                  <div
                    key={card.id}
                    className="flex items-center gap-3 py-3"
                    style={{ borderBottom: i < topCards.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                  >
                    <span
                      className="mono text-xs w-5 shrink-0 text-center"
                      style={{ color: ["var(--gold)", "#94a3b8", "#b45309"][i] }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{card.player}</p>
                      <p className="mono text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                        {card.year} {card.set_name}
                      </p>
                    </div>
                    <span className={`grade-badge ${getGradeBadgeClass(card.grade)} shrink-0`}>
                      {card.grade}
                    </span>
                    <div className="text-right shrink-0">
                      <p className="mono text-sm">${Number(card.price_paid).toFixed(2)}</p>
                      {pl != null && (
                        <p
                          className="mono text-[11px]"
                          style={{ color: pl >= 0 ? "var(--green)" : "var(--red)" }}
                        >
                          {pl >= 0 ? "+" : ""}${pl.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Limit warning ── */}
      {isAtLimit && (
        <div
          className="rounded-lg px-4 py-3 text-sm flex items-center justify-between"
          style={{ background: "rgba(212,175,55,0.06)", border: "1px solid var(--gold-border)", color: "var(--gold)" }}
        >
          <span>You've hit the 20-card free limit.</span>
          <button className="btn-gold px-3 py-1 text-xs">Upgrade to Pro — $4.99/mo</button>
        </div>
      )}

      <hr className="gold-rule" />

      {/* ── Collection ── */}
      {loading ? (
        <div className="text-center py-16 mono text-sm" style={{ color: "var(--text-muted)" }}>
          Loading collection...
        </div>
      ) : cards.length === 0 ? (
        <div
          className="text-center py-20 rounded-xl"
          style={{ border: "1px dashed rgba(212,175,55,0.15)", background: "rgba(212,175,55,0.02)" }}
        >
          <div className="text-4xl mb-4 opacity-40">◈</div>
          <p className="serif text-xl font-semibold mb-1">Start Your Collection</p>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Add your first card to begin tracking
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn-gold px-6 py-2.5 text-sm">
            + Add First Card
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            — Collection
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {cards.map((card) => {
              const pl = card.current_value != null
                ? Number(card.current_value) - Number(card.price_paid)
                : null;
              return (
                <div
                  key={card.id}
                  className="glass-card overflow-hidden group relative cursor-default"
                  style={{ borderRadius: "10px" }}
                >
                  {/* colour band */}
                  <div
                    className="h-1.5 w-full"
                    style={{
                      background: card.grade === "Raw"
                        ? "rgba(100,80,50,0.5)"
                        : "linear-gradient(90deg, var(--amber), var(--gold))",
                    }}
                  />
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <p className="font-bold text-sm leading-tight truncate flex-1">{card.player}</p>
                      <span className={`grade-badge ${getGradeBadgeClass(card.grade)} shrink-0`}>
                        {card.grade}
                      </span>
                    </div>
                    <p className="mono text-[11px] truncate mb-3" style={{ color: "var(--text-muted)" }}>
                      {card.year} {card.set_name}
                      {card.card_number ? ` #${card.card_number}` : ""}
                      {card.variation ? ` · ${card.variation}` : ""}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="mono text-sm font-medium">${Number(card.price_paid).toFixed(2)}</p>
                      {pl != null && (
                        <p
                          className="mono text-[11px]"
                          style={{ color: pl >= 0 ? "var(--green)" : "var(--red)" }}
                        >
                          {pl >= 0 ? "+" : ""}${pl.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* hover overlay */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2"
                    style={{ background: "rgba(8,8,8,0.82)", backdropFilter: "blur(4px)" }}
                  >
                    <button
                      onClick={() => setEditingCard(card)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium transition"
                      style={{ background: "var(--gold-dim)", color: "var(--gold)", border: "1px solid var(--gold-border)" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { if (confirm("Remove this card?")) deleteCard(card.id); }}
                      className="px-3 py-1.5 rounded-md text-xs font-medium transition"
                      style={{ background: "rgba(255,77,109,0.12)", color: "var(--red)", border: "1px solid rgba(255,77,109,0.25)" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
            {/* Add slot */}
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-xl flex flex-col items-center justify-center gap-1 py-8 transition"
              style={{
                border: "1px dashed rgba(212,175,55,0.18)",
                background: "rgba(212,175,55,0.02)",
                color: "var(--text-muted)",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.18)")}
            >
              <span className="text-xl">+</span>
              <span className="text-[11px] tracking-wide uppercase">Add Card</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            — Collection
          </p>
          <div className="space-y-1.5">
            {cards.map((card) => {
              const pl = card.current_value != null
                ? Number(card.current_value) - Number(card.price_paid)
                : null;
              return (
                <div
                  key={card.id}
                  className="glass-card flex items-center gap-4 px-4 py-3 group"
                >
                  <div
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{
                      background: card.grade === "Raw"
                        ? "rgba(100,80,50,0.5)"
                        : "linear-gradient(180deg, var(--gold), var(--amber))",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{card.player}</p>
                    <p className="mono text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                      {card.year} {card.set_name}
                      {card.card_number ? ` #${card.card_number}` : ""}
                      {card.variation ? ` · ${card.variation}` : ""}
                    </p>
                  </div>
                  <span className={`grade-badge ${getGradeBadgeClass(card.grade)} shrink-0`}>
                    {card.grade}
                  </span>
                  <div className="text-right shrink-0">
                    <p className="mono text-sm">${Number(card.price_paid).toFixed(2)}</p>
                    {pl != null ? (
                      <p className="mono text-[11px]" style={{ color: pl >= 0 ? "var(--green)" : "var(--red)" }}>
                        {pl >= 0 ? "+" : ""}${pl.toFixed(2)}
                      </p>
                    ) : (
                      <p className="mono text-[11px]" style={{ color: "var(--text-muted)" }}>no value</p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button
                      onClick={() => setEditingCard(card)}
                      className="px-2.5 py-1.5 rounded-md text-xs transition"
                      style={{ background: "var(--gold-dim)", color: "var(--gold)", border: "1px solid var(--gold-border)" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { if (confirm("Remove this card?")) deleteCard(card.id); }}
                      className="px-2.5 py-1.5 rounded-md text-xs transition"
                      style={{ background: "rgba(255,77,109,0.1)", color: "var(--red)", border: "1px solid rgba(255,77,109,0.2)" }}
                    >
                      Del
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
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