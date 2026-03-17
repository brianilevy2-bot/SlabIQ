import type { Express } from "express";
import { createServer, type Server } from "http";

let ebayToken: string | null = null;
let ebayTokenExpiry = 0;

async function getEbayToken(): Promise<string> {
  if (ebayToken && Date.now() < ebayTokenExpiry) return ebayToken;
  const clientId = process.env.EBAY_CLIENT_ID || "";
  const clientSecret = process.env.EBAY_CLIENT_SECRET || "";
  const credentials = Buffer.from(clientId + ":" + clientSecret).toString("base64");
  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + credentials,
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });
  const data = await res.json();
  ebayToken = data.access_token;
  ebayTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return ebayToken!;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/card-search", async (req, res) => {
    try {
      const query = (req.body?.q || req.query.q) as string;
      if (!query || query.length < 2) return res.json({ cards: [] });
      const token = await getEbayToken();
      const searchQuery = encodeURIComponent(query + " card");
      const ebayRes = await fetch(
        "https://api.ebay.com/buy/browse/v1/item_summary/search?q=" + searchQuery + "&limit=25",
        { headers: { "Authorization": "Bearer " + token, "X-EBAY-C-MARKETPLACE-ID": "EBAY_US" } }
      );
      const data = await ebayRes.json();
      if (!data.itemSummaries) return res.json({ cards: [] });
      const cards = data.itemSummaries
        .filter((item: any) => {
          const title = item.title.toLowerCase();
          return !title.includes("lot") && !title.includes("mystery") &&
                 !title.includes("reprint") && !title.includes("custom") &&
                 !title.includes("bundle");
        })
        .map((item: any) => {
          const title = item.title;
          const image = item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || null;
          const price = item.price?.value || null;
          const yearMatch = title.match(/\b(19|20)\d{2}\b/);
          const cardNumMatch = title.match(/#(\d+)/);
          const gradeMatch = title.match(/PSA\s*(\d+)/i) ||
                             title.match(/BGS\s*([\d.]+)/i) ||
                             title.match(/SGC\s*(\d+)/i);
          let grade = "Raw";
          if (gradeMatch) {
            const prefix = title.match(/PSA/i) ? "PSA" : title.match(/BGS/i) ? "BGS" : "SGC";
            grade = prefix + " " + gradeMatch[1];
          }
          return { title, year: yearMatch ? yearMatch[0] : "", card_number: cardNumMatch ? cardNumMatch[1] : "", grade, image, price };
        });
      const seen = new Set();
      const unique = cards.filter((c: any) => {
        const key = c.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      res.json({ cards: unique });
    } catch (err) {
      console.error("eBay search error:", err);
      res.status(500).json({ error: "Failed to search eBay." });
    }
  });

  app.post("/api/grading-roi", (req, res) => {
    try {
      const { raw_price, psa9_price, psa10_price, grading_cost, psa10_probability } = req.body;
      if ([raw_price, psa9_price, psa10_price, grading_cost, psa10_probability].some(
        (v: any) => v == null || isNaN(v)
      )) {
        return res.status(400).json({ error: "All fields are required and must be numbers." });
      }
      const prob10 = Math.min(Math.max(psa10_probability / 100, 0), 1);
      const prob9 = 1 - prob10;
      const psa9_profit  = psa9_price  - raw_price - grading_cost;
      const psa10_profit = psa10_price - raw_price - grading_cost;
      const expected_profit = prob10 * psa10_profit + prob9 * psa9_profit;
      const profit_diff = psa10_profit - psa9_profit;
      const break_even = profit_diff !== 0
        ? Math.max(0, Math.min(100, (-psa9_profit / profit_diff) * 100))
        : psa9_profit >= 0 ? 0 : 100;
      let verdict: string;
      let explanation: string;
      if (expected_profit > grading_cost * 0.5) {
        verdict = "Worth Grading";
        explanation = "Expected profit of $" + expected_profit.toFixed(2) + " at " + psa10_probability + "% PSA 10 chance.";
      } else if (expected_profit > 0) {
        verdict = "Risky";
        explanation = "Slight profit of $" + expected_profit.toFixed(2) + ", but you need " + break_even.toFixed(0) + "% PSA 10 rate to break even.";
      } else {
        verdict = "Don't Bother";
        explanation = "Expected loss of $" + Math.abs(expected_profit).toFixed(2) + ". Need " + break_even.toFixed(0) + "% PSA 10 rate to break even.";
      }
      res.json({
        verdict,
        expected_profit:       Math.round(expected_profit * 100) / 100,
        psa9_profit:           Math.round(psa9_profit   * 100) / 100,
        psa10_profit:          Math.round(psa10_profit  * 100) / 100,
        break_even_psa10_rate: Math.round(break_even    * 10)  / 10,
        explanation,
      });
    } catch (err) {
      console.error("Grading ROI error:", err);
      res.status(500).json({ error: "Failed to calculate grading ROI." });
    }
  });

  app.post("/api/parse-checklist", (req, res) => {
    try {
      const { text } = req.body;
      if (!text || text.trim().length < 5) {
        return res.status(400).json({ error: "No text provided." });
      }

      const lines = text.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      const cards: { card_number: string; player: string }[] = [];

      for (const line of lines) {
        if (/^(checklist|set|base|insert|parallel|card#|card number|player|name|#)$/i.test(line)) continue;
        if (line.length < 2) continue;

        const withNumber = line.match(/^#?(\d+)[\.\s\-\)]+(.+)$/);
        if (withNumber) {
          const player = withNumber[2]
            .replace(/\b(rc|rookie|sp|ssp|auto|patch|refractor|prizm|chrome|base|card)\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();
          if (player.length > 1) {
            cards.push({ card_number: withNumber[1], player });
            continue;
          }
        }

        const numberAtEnd = line.match(/^(.+?)\s+#?(\d+)$/);
        if (numberAtEnd) {
          const player = numberAtEnd[1]
            .replace(/\b(rc|rookie|sp|ssp|auto|patch|refractor|prizm|chrome|base|card)\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();
          if (player.length > 1) {
            cards.push({ card_number: numberAtEnd[2], player });
            continue;
          }
        }

        const clean = line
          .replace(/\b(rc|rookie|sp|ssp|auto|patch|refractor|prizm|chrome|base|card)\b/gi, "")
          .replace(/\s+/g, " ")
          .trim();
        if (clean.length > 2 && /[a-zA-Z]/.test(clean)) {
          cards.push({ card_number: "", player: clean });
        }
      }

      if (cards.length === 0) {
        return res.status(422).json({ error: "No cards found. Make sure each card is on its own line." });
      }

      res.json({ cards, count: cards.length });
    } catch (err) {
      console.error("Checklist parse error:", err);
      res.status(500).json({ error: "Failed to parse checklist." });
    }
  });

  return httpServer;
}
