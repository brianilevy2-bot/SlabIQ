import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || "",
  import.meta.env.VITE_SUPABASE_ANON_KEY || ""
);

interface CardSet {
  id: string;
  name: string;
  year: string;
  description: string;
  total_cards: number;
  created_at: string;
}

interface SetCard {
  id: string;
  set_id: string;
  card_number: string;
  player: string;
  parallel: string;
  owned: boolean;
  est_cost: number | null;
}

interface EbayResult {
  title: string;
  year: string;
  card_number: string;
  grade: string;
  image: string | null;
  price: string | null;
}

type View = "list" | "detail";
type AddMode = "search" | "manual" | "paste";

const PARALLELS = [
  "Base", "Silver Prizm", "Gold Prizm", "Red Prizm", "Blue Prizm",
  "Refractor", "Gold Refractor", "Chrome", "Holo", "SSP", "SP",
  "Photo Variation", "Numbered", "Auto", "Patch Auto", "Custom",
];

export default function SetsPage() {
  const [view, setView]           = useState<View>("list");
  const [sets, setSets]           = useState<CardSet[]>([]);
  const [activeSet, setActiveSet] = useState<CardSet | null>(null);
  const [setCards, setSetCards]   = useState<SetCard[]>([]);
  const [loading, setLoading]     = useState(true);

  // Create set modal
  const [showCreateSet, setShowCreateSet] = useState(false);
  const [newSetName, setNewSetName]       = useState("");
  const [newSetYear, setNewSetYear]       = useState("");
  const [newSetDesc, setNewSetDesc]       = useState("");
  const [newSetTotal, setNewSetTotal]     = useState("");
  const [savingSet, setSavingSet]         = useState(false);

  // Add card modal
  const [showAddCard, setShowAddCard]     = useState(false);
  const [addMode, setAddMode]             = useState<AddMode>("search");

  // Search mode
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState<EbayResult[]>([]);
  const [searching, setSearching]         = useState(false);

  // Manual mode
  const [newPlayer, setNewPlayer]         = useState("");
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newParallel, setNewParallel]     = useState("Base");
  const [newOwned, setNewOwned]           = useState(false);
  const [newEstCost, setNewEstCost]       = useState("");
  const [savingCard, setSavingCard]       = useState(false);

  // Paste mode
  const [pasteText, setPasteText]         = useState("");
  const [parsedCards, setParsedCards]     = useState<{ card_number: string; player: string }[]>([]);
  const [parsing, setParsing]             = useState(false);
  const [parseError, setParseError]       = useState("");
  const [pasteParallel, setPasteParallel] = useState("Base");
  const [importingPaste, setImportingPaste] = useState(false);

  useEffect(() => { fetchSets(); }, []);

  // eBay search debounce
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(() => doEbaySearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  async function fetchSets() {
    setLoading(true);
    const { data } = await supabase
      .from("sets")
      .select("*")
      .order("created_at", { ascending: false });
    setSets(data || []);
    setLoading(false);
  }

  async function fetchSetCards(setId: string) {
    const { data } = await supabase
      .from("set_cards")
      .select("*")
      .eq("set_id", setId)
      .order("card_number", { ascending: true });
    setSetCards(data || []);
  }

  async function doEbaySearch(q: string) {
    setSearching(true);
    try {
      const res = await fetch("/api/card-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q }),
      });
      const data = await res.json();
      setSearchResults(data.cards || []);
    } catch (err) { console.error(err); }
    setSearching(false);
  }

  async function createSet(e: React.FormEvent) {
    e.preventDefault();
    setSavingSet(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("sets").insert({
      user_id:     user.id,
      name:        newSetName.trim(),
      year:        newSetYear.trim(),
      description: newSetDesc.trim(),
      total_cards: parseInt(newSetTotal) || 0,
    }).select().single();
    if (!error && data) {
      setShowCreateSet(false);
      resetCreateSet();
      await fetchSets();
      openSet(data);
    }
    setSavingSet(false);
  }

  function resetCreateSet() {
    setNewSetName(""); setNewSetYear(""); setNewSetDesc(""); setNewSetTotal("");
  }

  function resetAddCard() {
    setSearchQuery(""); setSearchResults([]);
    setNewPlayer(""); setNewCardNumber(""); setNewParallel("Base");
    setNewOwned(false); setNewEstCost("");
    setPasteText(""); setParsedCards([]); setParseError("");
    setPasteParallel("Base");
    setAddMode("search");
  }

  async function deleteSet(id: string) {
    if (!confirm("Delete this set and all its cards?")) return;
    await supabase.from("sets").delete().eq("id", id);
    fetchSets();
    if (activeSet?.id === id) { setView("list"); setActiveSet(null); }
  }

  function openSet(s: CardSet) {
    setActiveSet(s);
    fetchSetCards(s.id);
    setView("detail");
  }

  // ── Select a card from eBay search ──
  function selectEbayResult(r: EbayResult) {
    let name = r.title
      .replace(/\b(19|20)\d{2}\b/g, "")
      .replace(/#\d+/g, "")
      .replace(/PSA\s*\d+/gi, "").replace(/BGS\s*[\d.]+/gi, "").replace(/SGC\s*\d+/gi, "")
      .replace(/\b(topps|bowman|chrome|prizm|donruss|panini|select|mosaic|optic|update|series|base|rookie|rc|card|refractor|parallel|insert|auto|autograph|patch|relic|numbered|\/\d+)\b/gi, "")
      .replace(/[-–—|,]/g, " ").replace(/\s+/g, " ").trim();
    setNewPlayer(name.split(" ").slice(0, 3).join(" "));
    setNewCardNumber(r.card_number);
    if (r.price) setNewEstCost(parseFloat(r.price).toFixed(2));
    setAddMode("manual");
  }

  // ── Add single card manually ──
  async function addCardToSet(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSet) return;
    setSavingCard(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("set_cards").insert({
      set_id:      activeSet.id,
      user_id:     user.id,
      player:      newPlayer.trim(),
      card_number: newCardNumber.trim(),
      parallel:    newParallel,
      owned:       newOwned,
      est_cost:    newEstCost ? parseFloat(newEstCost) : null,
    });
    setShowAddCard(false);
    resetAddCard();
    fetchSetCards(activeSet.id);
    setSavingCard(false);
  }

  // ── Parse pasted checklist ──
  async function parseChecklist() {
    if (!pasteText.trim()) return;
    setParsing(true);
    setParseError("");
    setParsedCards([]);
    try {
      const res = await fetch("/api/parse-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      setParsedCards(data.cards);
    } catch (err: any) {
      setParseError(err.message);
    }
    setParsing(false);
  }

  // ── Bulk import parsed cards ──
  async function importParsedCards() {
    if (!activeSet || parsedCards.length === 0) return;
    setImportingPaste(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const rows = parsedCards.map(c => ({
      set_id:      activeSet.id,
      user_id:     user.id,
      player:      c.player,
      card_number: c.card_number,
      parallel:    pasteParallel,
      owned:       false,
      est_cost:    null,
    }));
    await supabase.from("set_cards").insert(rows);
    setShowAddCard(false);
    resetAddCard();
    fetchSetCards(activeSet.id);
    setImportingPaste(false);
  }

  async function toggleOwned(card: SetCard) {
    await supabase.from("set_cards").update({ owned: !card.owned }).eq("id", card.id);
    setSetCards(prev => prev.map(c => c.id === card.id ? { ...c, owned: !c.owned } : c));
  }

  async function deleteCard(id: string) {
    await supabase.from("set_cards").delete().eq("id", id);
    setSetCards(prev => prev.filter(c => c.id !== id));
  }

  // ════════════════════════════════════════════
  // LIST VIEW
  // ════════════════════════════════════════════
  if (view === "list") {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="serif text-3xl font-semibold tracking-wide" style={{ color: "var(--text-primary)" }}>
              Set Tracker
            </h1>
            <p className="mono text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Track your set completion goals
            </p>
          </div>
          <button onClick={() => setShowCreateSet(true)} className="btn-gold px-4 py-2 text-sm">
            + New Set
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 mono text-sm" style={{ color: "var(--text-muted)" }}>
            Loading sets...
          </div>
        ) : sets.length === 0 ? (
          <div
            className="text-center py-24 rounded-xl"
            style={{ border: "1px dashed rgba(212,175,55,0.15)", background: "rgba(212,175,55,0.02)" }}
          >
            <div className="text-4xl mb-4 opacity-40">◫</div>
            <p className="serif text-xl font-semibold mb-1">No Sets Yet</p>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Create a set to start tracking completion progress
            </p>
            <button onClick={() => setShowCreateSet(true)} className="btn-gold px-6 py-2.5 text-sm">
              + Create First Set
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sets.map(s => (
              <SetCardTile key={s.id} set={s} onOpen={() => openSet(s)} onDelete={() => deleteSet(s.id)} />
            ))}
          </div>
        )}

        {showCreateSet && (
          <Modal title="New Set" subtitle="Define a set to track" onClose={() => { setShowCreateSet(false); resetCreateSet(); }}>
            <form onSubmit={createSet} className="space-y-4">
              <div>
                <label className="field-label">Set Name <span style={{ color: "var(--red)" }}>*</span></label>
                <input type="text" value={newSetName} onChange={e => setNewSetName(e.target.value)}
                  placeholder="e.g. 2017 Panini Prizm Football" required className="input-sleek" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Year <span style={{ color: "var(--red)" }}>*</span></label>
                  <input type="text" value={newSetYear} onChange={e => setNewSetYear(e.target.value)}
                    placeholder="2017" required className="input-sleek" />
                </div>
                <div>
                  <label className="field-label">Total Cards in Set</label>
                  <input type="number" min="0" value={newSetTotal} onChange={e => setNewSetTotal(e.target.value)}
                    placeholder="e.g. 300" className="input-sleek" />
                </div>
              </div>
              <div>
                <label className="field-label">Notes</label>
                <input type="text" value={newSetDesc} onChange={e => setNewSetDesc(e.target.value)}
                  placeholder="e.g. Base set only" className="input-sleek" />
              </div>
              <ModalButtons onCancel={() => { setShowCreateSet(false); resetCreateSet(); }}
                submitLabel="Create Set" loading={savingSet} />
            </form>
          </Modal>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════
  // DETAIL VIEW
  // ════════════════════════════════════════════
  const owned    = setCards.filter(c => c.owned).length;
  const total    = activeSet!.total_cards || setCards.length;
  const missing  = setCards.filter(c => !c.owned);
  const pct      = total > 0 ? Math.round((owned / total) * 100) : 0;
  const estCostToComplete = missing.reduce((s, c) => s + (c.est_cost ? Number(c.est_cost) : 0), 0);
  const hasAnyCost = missing.some(c => c.est_cost != null);

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setView("list"); setActiveSet(null); }}
            className="mono text-xs px-3 py-1.5 rounded-md transition"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)", background: "transparent" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--gold)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            ← Sets
          </button>
          <div>
            <h1 className="serif text-3xl font-semibold tracking-wide" style={{ color: "var(--text-primary)" }}>
              {activeSet!.name}
            </h1>
            <p className="mono text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {activeSet!.year}{activeSet!.description ? ` · ${activeSet!.description}` : ""}
            </p>
          </div>
        </div>
        <button onClick={() => setShowAddCard(true)} className="btn-gold px-4 py-2 text-sm">
          + Add Cards
        </button>
      </div>

      {/* Progress panel */}
      <div className="rounded-xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
              — Completion
            </p>
            <p className="serif text-4xl font-semibold" style={{ color: "var(--gold)" }}>{pct}%</p>
          </div>
          <div className="text-right">
            <p className="mono text-2xl font-medium" style={{ color: "var(--text-primary)" }}>
              {owned} <span style={{ color: "var(--text-muted)" }}>/ {total}</span>
            </p>
            <p className="mono text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>cards owned</p>
          </div>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden mb-5"
          style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? "var(--green)" : "linear-gradient(90deg, var(--amber), var(--gold))",
            }} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Owned",   value: String(owned),   color: "var(--green)" },
            { label: "Missing", value: String(missing.length), color: "var(--red)" },
            { label: "Est. Cost to Complete", value: hasAnyCost ? `$${estCostToComplete.toFixed(2)}` : "—", color: "var(--gold)" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              <p className="mono text-lg font-medium" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cards */}
      {setCards.length === 0 ? (
        <div className="text-center py-16 rounded-xl"
          style={{ border: "1px dashed rgba(212,175,55,0.15)", background: "rgba(212,175,55,0.02)" }}>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            No cards yet. Add individually or paste a full checklist.
          </p>
          <button onClick={() => setShowAddCard(true)} className="btn-gold px-5 py-2 text-sm">
            + Add Cards
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {setCards.filter(c => c.owned).length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                — Owned ({setCards.filter(c => c.owned).length})
              </p>
              <div className="space-y-1.5">
                {setCards.filter(c => c.owned).map(card => (
                  <CardRow key={card.id} card={card} onToggle={() => toggleOwned(card)} onDelete={() => deleteCard(card.id)} />
                ))}
              </div>
            </div>
          )}
          {missing.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                — Missing ({missing.length})
              </p>
              <div className="space-y-1.5">
                {missing
                  .sort((a, b) => (a.est_cost ?? Infinity) - (b.est_cost ?? Infinity))
                  .map(card => (
                    <CardRow key={card.id} card={card} onToggle={() => toggleOwned(card)} onDelete={() => deleteCard(card.id)} />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add card modal */}
      {showAddCard && (
        <Modal
          title="Add Cards"
          subtitle={activeSet!.name}
          onClose={() => { setShowAddCard(false); resetAddCard(); }}
        >
          {/* Mode tabs */}
          <div className="flex rounded-lg p-0.5 gap-0.5 mb-5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)" }}>
            {(["search", "manual", "paste"] as AddMode[]).map(m => (
              <button key={m} onClick={() => setAddMode(m)}
                className="flex-1 py-1.5 rounded-md text-xs font-medium transition capitalize"
                style={{
                  background: addMode === m ? "var(--gold-dim)" : "transparent",
                  color:      addMode === m ? "var(--gold)"     : "var(--text-muted)",
                  border:     addMode === m ? "1px solid var(--gold-border)" : "1px solid transparent",
                }}>
                {m === "search" ? "eBay Search" : m === "manual" ? "Manual" : "Paste List"}
              </button>
            ))}
          </div>

          {/* ── SEARCH TAB ── */}
          {addMode === "search" && (
            <div className="space-y-3">
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search eBay for a card..." className="input-sleek" autoFocus />
              {searching && (
                <p className="mono text-[11px]" style={{ color: "var(--text-muted)" }}>Searching eBay...</p>
              )}
              {searchResults.length > 0 && (
                <div className="rounded-lg overflow-hidden max-h-56 overflow-y-auto"
                  style={{ border: "1px solid var(--border-subtle)" }}>
                  {searchResults.map((r, i) => (
                    <button key={i} onClick={() => selectEbayResult(r)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition"
                      style={{ borderBottom: i < searchResults.length - 1 ? "1px solid var(--border-subtle)" : "none", background: "transparent" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--gold-dim)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      {r.image
                        ? <img src={r.image} alt="" className="w-10 h-10 object-cover rounded-md shrink-0" />
                        : <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
                            style={{ background: "var(--bg-elevated)" }}>🃏</div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{r.title}</p>
                        {r.price && <p className="mono text-[11px] mt-0.5" style={{ color: "var(--gold)" }}>${parseFloat(r.price).toFixed(2)}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                <p className="mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                  No results — try Manual or Paste List.
                </p>
              )}
            </div>
          )}

          {/* ── MANUAL TAB ── */}
          {addMode === "manual" && (
            <form onSubmit={addCardToSet} className="space-y-4">
              <div>
                <label className="field-label">Player <span style={{ color: "var(--red)" }}>*</span></label>
                <input type="text" value={newPlayer} onChange={e => setNewPlayer(e.target.value)}
                  placeholder="e.g. Patrick Mahomes" required className="input-sleek" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Card #</label>
                  <input type="text" value={newCardNumber} onChange={e => setNewCardNumber(e.target.value)}
                    placeholder="e.g. 269" className="input-sleek" />
                </div>
                <div>
                  <label className="field-label">Parallel</label>
                  <select value={newParallel} onChange={e => setNewParallel(e.target.value)} className="input-sleek">
                    {PARALLELS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="field-label">Est. Cost</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-sm select-none"
                    style={{ color: "var(--text-muted)" }}>$</span>
                  <input type="number" step="0.01" min="0" value={newEstCost}
                    onChange={e => setNewEstCost(e.target.value)} placeholder="Optional"
                    className="input-sleek" style={{ paddingLeft: "1.6rem" }} />
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
                onClick={() => setNewOwned(!newOwned)}>
                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition"
                  style={{
                    background: newOwned ? "var(--gold)" : "transparent",
                    border: newOwned ? "1px solid var(--gold)" : "1px solid var(--border-hover)",
                  }}>
                  {newOwned && <span style={{ color: "#080808", fontSize: "11px", fontWeight: 700 }}>✓</span>}
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  I already own this card
                </span>
              </div>
              <ModalButtons onCancel={() => setAddMode("search")}
                submitLabel={newOwned ? "Add as Owned" : "Add as Missing"} loading={savingCard} />
            </form>
          )}

          {/* ── PASTE TAB ── */}
          {addMode === "paste" && (
            <div className="space-y-4">
              <div>
                <label className="field-label">Paste Checklist Text</label>
                <textarea
                  value={pasteText}
                  onChange={e => { setPasteText(e.target.value); setParsedCards([]); setParseError(""); }}
                  placeholder={"Paste any checklist text here — from TCDB, a website, a forum post, anywhere.\n\nExample:\n1 Patrick Mahomes RC\n2 Josh Allen RC\n3 Lamar Jackson RC"}
                  rows={8}
                  className="input-sleek"
                  style={{ resize: "vertical", fontFamily: "var(--font-mono)", fontSize: "12px" }}
                  autoFocus
                />
              </div>

              {parseError && (
                <div className="rounded-lg px-4 py-2.5 mono text-xs"
                  style={{ background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.2)", color: "var(--red)" }}>
                  {parseError}
                </div>
              )}

              {/* Preview */}
              {parsedCards.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                    — {parsedCards.length} cards found — preview
                  </p>
                  <div className="rounded-lg overflow-hidden max-h-48 overflow-y-auto"
                    style={{ border: "1px solid var(--border-subtle)" }}>
                    {parsedCards.slice(0, 50).map((c, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2"
                        style={{ borderBottom: i < Math.min(parsedCards.length, 50) - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                        {c.card_number && (
                          <span className="mono text-[11px] w-8 shrink-0" style={{ color: "var(--text-muted)" }}>
                            #{c.card_number}
                          </span>
                        )}
                        <span className="text-sm" style={{ color: "var(--text-primary)" }}>{c.player}</span>
                      </div>
                    ))}
                    {parsedCards.length > 50 && (
                      <div className="px-3 py-2 mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                        ...and {parsedCards.length - 50} more
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <label className="field-label">Parallel for all imported cards</label>
                    <select value={pasteParallel} onChange={e => setPasteParallel(e.target.value)} className="input-sleek">
                      {PARALLELS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <button onClick={importParsedCards} disabled={importingPaste}
                    className="btn-gold w-full py-2.5 text-sm tracking-wide mt-3">
                    {importingPaste ? "Importing..." : `Import ${parsedCards.length} Cards`}
                  </button>
                </div>
              )}

              {parsedCards.length === 0 && (
                <button onClick={parseChecklist} disabled={parsing || pasteText.trim().length < 5}
                  className="btn-gold w-full py-2.5 text-sm tracking-wide">
                  {parsing ? "Parsing with AI..." : "Parse Checklist"}
                </button>
              )}

              {parsedCards.length > 0 && (
                <button onClick={() => { setParsedCards([]); setPasteText(""); }}
                  className="w-full py-2 text-xs transition"
                  style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)", borderRadius: "8px", background: "transparent" }}>
                  ← Start Over
                </button>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function SetCardTile({ set, onOpen, onDelete }: { set: CardSet; onOpen: () => void; onDelete: () => void }) {
  return (
    <div className="glass-card p-5 cursor-pointer group relative" onClick={onOpen}>
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
        style={{ background: "linear-gradient(90deg, var(--amber), var(--gold))" }} />
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>{set.name}</p>
          <p className="mono text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{set.year}</p>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 transition p-1 rounded text-lg leading-none"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>×</button>
      </div>
      {set.description && (
        <p className="text-[11px] mb-3 truncate" style={{ color: "var(--text-muted)" }}>{set.description}</p>
      )}
      <div className="flex items-center justify-between">
        <p className="mono text-xs" style={{ color: "var(--text-muted)" }}>
          {set.total_cards > 0 ? `${set.total_cards} cards defined` : "Open to track"}
        </p>
        <span className="mono text-[11px]" style={{ color: "var(--gold)" }}>View →</span>
      </div>
    </div>
  );
}

function CardRow({ card, onToggle, onDelete }: { card: SetCard; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="glass-card flex items-center gap-3 px-4 py-3 group">
      <button onClick={onToggle}
        className="w-5 h-5 rounded shrink-0 flex items-center justify-center transition"
        style={{
          background: card.owned ? "var(--gold)" : "transparent",
          border: card.owned ? "1px solid var(--gold)" : "1px solid rgba(212,175,55,0.3)",
        }}>
        {card.owned && <span style={{ color: "#080808", fontSize: "10px", fontWeight: 700 }}>✓</span>}
      </button>
      {card.card_number && (
        <span className="mono text-[11px] w-8 text-center shrink-0" style={{ color: "var(--text-muted)" }}>
          #{card.card_number}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate"
          style={{ color: card.owned ? "var(--text-primary)" : "var(--text-secondary)" }}>
          {card.player}
        </p>
        {card.parallel && card.parallel !== "Base" && (
          <p className="mono text-[11px]" style={{ color: "var(--text-muted)" }}>{card.parallel}</p>
        )}
      </div>
      {card.est_cost != null && (
        <span className="mono text-xs shrink-0"
          style={{ color: card.owned ? "var(--text-muted)" : "var(--gold)" }}>
          ${Number(card.est_cost).toFixed(2)}
        </span>
      )}
      <span className="mono text-[10px] px-2 py-0.5 rounded shrink-0"
        style={{
          background: card.owned ? "rgba(62,207,142,0.1)"  : "rgba(255,77,109,0.08)",
          color:      card.owned ? "var(--green)"           : "var(--red)",
          border:     `1px solid ${card.owned ? "rgba(62,207,142,0.2)" : "rgba(255,77,109,0.15)"}`,
        }}>
        {card.owned ? "Owned" : "Missing"}
      </span>
      <button onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition mono text-sm shrink-0"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>×</button>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}>
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl"
        style={{ background: "#0e0e0e", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <h2 className="serif text-xl font-semibold">{title}</h2>
            {subtitle && <p className="mono text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-lg transition"
            style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ModalButtons({ onCancel, submitLabel, loading }: {
  onCancel: () => void; submitLabel: string; loading: boolean;
}) {
  return (
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onCancel}
        className="flex-1 py-2.5 rounded-lg text-sm font-medium transition"
        style={{ border: "1px solid var(--border-subtle)", color: "var(--text-muted)", background: "transparent" }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--gold-border)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-subtle)")}>
        Cancel
      </button>
      <button type="submit" disabled={loading} className="btn-gold flex-1 py-2.5 text-sm tracking-wide">
        {loading ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}