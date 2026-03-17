export interface PortfolioCard {
  id: string;
  user_id: string;
  player: string;
  year: string;
  set_name: string;
  card_number: string;
  grade: string;
  price_paid: number;
  current_value: number | null;
  notes: string;
  created_at: string;
}

export interface NewCard {
  player: string;
  year: string;
  set_name: string;
  card_number: string;
  grade: string;
  price_paid: number;
  current_value: number | null;
  notes: string;
}

export interface GradingROIInput {
  raw_price: number;
  psa9_price: number;
  psa10_price: number;
  grading_cost: number;
  psa10_probability: number;
}

export interface GradingROIResult {
  verdict: "Worth Grading" | "Risky" | "Don't Bother";
  expected_profit: number;
  psa9_profit: number;
  psa10_profit: number;
  break_even_psa10_rate: number;
  explanation: string;
}

export const FREE_CARD_LIMIT = 20;
export const FREE_ROI_LOOKUPS_PER_MONTH = 5;
