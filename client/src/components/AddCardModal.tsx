import { useState, useEffect } from "react";

const GRADES = ["Raw","PSA 1","PSA 2","PSA 3","PSA 4","PSA 5","PSA 6","PSA 7","PSA 8","PSA 9","PSA 10","BGS 9","BGS 9.5","BGS 10","SGC 9","SGC 10"];

interface CardData {
  player: string; year: string; set_name: string; card_number: string;
  variation: string; grade: string; price_paid: number;
  current_value: number | null; notes: string;
}
interface EbayCard {
  title: string; year: string; card_number: string;
  grade: string; image: string | null; price: string | null;
}
interface Props {
  card?: CardData & { id: string };
  onSave: (card: CardData) => void;
  onClose: () => void;
}

export default function AddCardModal({ card, onSave, onClose }: Props) {
  const isEditing = !!card;
  const [mode, setMode] = useState<"search" | "manual">(isEditing ? "manual" : "search");

  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<EbayCard[]>([]);
  const [searching,     setSearching]     = useState(false);

  const [player,       setPlayer]       = useState(card?.player       || "");
  const [year,         setYear]         = useState(card?.year         || "");
  const [setName,      setSetName]      = useState(card?.set_name     || "");
  const [cardNumber,   setCardNumber]   = useState(card?.card_number  || "");
  const [variation,    setVariation]    = useState(card?.variation    || "");
  const [grade,        setGrade]        = useState(card?.grade        || "Raw");
  const [pricePaid,    setPricePaid]    = useState(card?.price_paid?.toString()    || "");
  const [currentValue, setCurrentValue] = useState(card?.current_value?.toString() || "");
  const [notes,        setNotes]        = useState(card?.notes        || "");

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(() => doSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  async function doSearch(q: string) {
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

  function selectCard(ec: EbayCard) {
    let name = ec.title
      .replace(/\b(19|20)\d{2}\b/g, "")
      .replace(/#\d+/g, "")
      .replace(/PSA\s*\d+/gi, "").replace(/BGS\s*[\d.]+/gi, "").replace(/SGC\s*\d+/gi, "")
      .replace(/\b(topps|bowman|chrome|prizm|donruss|panini|select|mosaic|optic|update|series|base|rookie|rc|card|refractor|parallel|insert|auto|autograph|patch|relic|numbered|\/\d+)\b/gi, "")
      .replace(/[-–—|,]/g, " ").replace(/\s+/g, " ").trim();
    setPlayer(name.split(" ").slice(0, 3).join(" "));
    setYear(ec.year);
    setCardNumber(ec.card_number);
    setGrade("Raw");
    if (ec.price) setCurrentValue(parseFloat(ec.price).toFixed(2));
    setMode("manual");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      player: player.trim(), year: year.trim(), set_name: setName.trim(),
      card_number: cardNumber.trim(), variation: variation.trim(), grade,
      price_paid: parseFloat(pricePaid) || 0,
      current_value: currentValue ? parseFloat(currentValue) : null,
      notes: notes.trim(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "transparent" }}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div>
            <h2 className="serif text-xl font-semibold">
              {isEditing ? "Edit Card" : "Add Card"}
            </h2>
            <p className="mono text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              {isEditing ? "Update card details" : "Search eBay or enter manually"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-lg transition"
            style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            ×
          </button>
        </div>

        {/* Mode toggle */}
        {!isEditing && (
          <div className="px-6 pt-5">
            <div
              className="flex rounded-lg p-0.5 gap-0.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)" }}
            >
              {(["search", "manual"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 py-1.5 rounded-md text-sm font-medium transition capitalize"
                  style={{
                    background: mode === m ? "var(--gold-dim)" : "transparent",
                    color:      mode === m ? "var(--gold)"     : "var(--text-muted)",
                    border:     mode === m ? "1px solid var(--gold-border)" : "1px solid transparent",
                  }}
                >
                  {m === "search" ? "eBay Search" : "Manual Entry"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Search mode ── */}
        {mode === "search" && !isEditing && (
          <div className="px-6 pt-4 pb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="e.g. 2017 Prizm Mahomes Rookie..."
              className="input-sleek"
              autoFocus
            />

            {searching && (
              <p className="mono text-[11px] mt-2.5" style={{ color: "var(--text-muted)" }}>
                Searching eBay...
              </p>
            )}

            {searchResults.length > 0 && (
              <div
                className="mt-3 rounded-lg overflow-hidden max-h-64 overflow-y-auto"
                style={{ border: "1px solid var(--border-subtle)" }}
              >
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => selectCard(r)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition"
                    style={{
                      borderBottom: i < searchResults.length - 1 ? "1px solid var(--border-subtle)" : "none",
                      background: "transparent",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--gold-dim)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {r.image ? (
                      <img src={r.image} alt="" className="w-11 h-11 object-cover rounded-md shrink-0" />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-md flex items-center justify-center text-base shrink-0"
                        style={{ background: "var(--bg-elevated)" }}
                      >
                        🃏
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {r.title}
                      </p>
                      {r.price && (
                        <p className="mono text-[11px] mt-0.5" style={{ color: "var(--gold)" }}>
                          ${parseFloat(r.price).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
              <p className="mono text-[11px] mt-3" style={{ color: "var(--text-muted)" }}>
                No results — try different terms or use Manual Entry.
              </p>
            )}
          </div>
        )}

        {/* ── Manual entry form ── */}
        {mode === "manual" && (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                Player Name <span style={{ color: "var(--red)" }}>*</span>
              </label>
              <input type="text" value={player} onChange={e => setPlayer(e.target.value)} placeholder="e.g. Patrick Mahomes" required className="input-sleek" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Year <span style={{ color: "var(--red)" }}>*</span></label>
                <input type="text" value={year} onChange={e => setYear(e.target.value)} placeholder="2017" required className="input-sleek" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Set <span style={{ color: "var(--red)" }}>*</span></label>
                <input type="text" value={setName} onChange={e => setSetName(e.target.value)} placeholder="Panini Prizm" required className="input-sleek" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Card #</label>
                <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="269" className="input-sleek" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Variation</label>
                <input type="text" value={variation} onChange={e => setVariation(e.target.value)} placeholder="SP, Refractor..." className="input-sleek" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Grade <span style={{ color: "var(--red)" }}>*</span></label>
              <select value={grade} onChange={e => setGrade(e.target.value)} className="input-sleek">
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Price Paid <span style={{ color: "var(--red)" }}>*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-sm pointer-events-none" style={{ color: "var(--text-muted)" }}>$</span>
                  <input type="number" step="0.01" min="0" value={pricePaid} onChange={e => setPricePaid(e.target.value)} placeholder="0.00" required className="input-sleek pl-6" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Current Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-sm pointer-events-none" style={{ color: "var(--text-muted)" }}>$</span>
                  <input type="number" step="0.01" min="0" value={currentValue} onChange={e => setCurrentValue(e.target.value)} placeholder="Optional" className="input-sleek pl-6" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" className="input-sleek" />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={!isEditing ? () => setMode("search") : onClose}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition"
                style={{ border: "1px solid var(--border-subtle)", color: "var(--text-muted)", background: "transparent" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--gold-border)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
              >
                {!isEditing ? "← Back to Search" : "Cancel"}
              </button>
              <button type="submit" className="btn-gold flex-1 py-2.5 text-sm tracking-wide">
                {isEditing ? "Save Changes" : "Add to Portfolio"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}