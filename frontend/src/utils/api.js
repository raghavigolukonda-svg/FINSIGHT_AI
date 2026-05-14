const BASE = "/api";

async function get(path, params = {}) {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  Object.entries(params).forEach(([k,v]) => v !== undefined && url.searchParams.set(k,v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API POST ${path} → ${res.status}`);
  return res.json();
}

async function put(path) {
  const res = await fetch(`${BASE}${path}`, { method: "PUT" });
  if (!res.ok) throw new Error(`API PUT ${path} → ${res.status}`);
  return res.json();
}

export const api = {
  kpis:              ()         => get("/analytics/kpis"),
  dailyTrends:       ()         => get("/analytics/trends/daily"),
  hourlyTrends:      ()         => get("/analytics/trends/hourly"),
  insights:          ()         => get("/analytics/insights"),
  transactions:      (p)        => get("/transactions/", p),
  transactionSummary:()         => get("/transactions/stats/summary"),
  createTransaction: (b)        => post("/transactions/", b),
  fraudAlerts:       (p)        => get("/fraud/alerts", p),
  fraudStats:        ()         => get("/fraud/stats"),
  fraudCheck:        (b)        => post("/fraud/check", b),
  resolveAlert:      (id)       => put(`/fraud/alerts/${id}/resolve`),
  modelStats:        ()         => get("/fraud/model/stats"),
  trainModel:        ()         => post("/fraud/model/train", {}),
  riskProfiles:      ()         => get("/risk/"),
  userRisk:          (uid)      => get(`/risk/${uid}`),
  marketOverview:    ()         => get("/market/overview"),
  symbolHistory:     (s,pts)    => get(`/market/${s}/history`, {points:pts}),
  sentimentSummary:  ()         => get("/market/sentiment/summary"),
};

export default api;
