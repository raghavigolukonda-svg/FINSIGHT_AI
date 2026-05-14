from fastapi import APIRouter
from database import get_connection

router = APIRouter()


@router.get("/kpis")
def kpis():
    conn = get_connection(); c = conn.cursor()
    total   = c.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
    vol     = c.execute("SELECT COALESCE(SUM(amount),0) FROM transactions").fetchone()[0]
    fraud   = c.execute("SELECT COUNT(*) FROM transactions WHERE is_fraud=1").fetchone()[0]
    alerts  = c.execute("SELECT COUNT(*) FROM fraud_alerts WHERE resolved=0").fetchone()[0]
    avg_txn = c.execute("SELECT AVG(amount) FROM transactions").fetchone()[0] or 0
    crit    = c.execute("SELECT COUNT(*) FROM risk_profiles WHERE tier='CRITICAL'").fetchone()[0]
    high    = c.execute("SELECT COUNT(*) FROM risk_profiles WHERE tier='HIGH'").fetchone()[0]
    conn.close()
    return {"total_transactions":total,"total_volume":round(vol,2),
            "fraud_count":fraud,"fraud_rate_pct":round(fraud/max(total,1)*100,2),
            "open_alerts":alerts,"avg_transaction_value":round(avg_txn,2),
            "critical_risk_users":crit,"high_risk_users":high}


@router.get("/trends/daily")
def daily():
    conn = get_connection(); c = conn.cursor()
    rows = c.execute("""SELECT date(timestamp) as day,COUNT(*) as transactions,
        SUM(amount) as volume,SUM(is_fraud) as fraud_count,AVG(fraud_score) as avg_fraud_score
        FROM transactions WHERE timestamp>=date('now','-30 days')
        GROUP BY date(timestamp) ORDER BY day""").fetchall()
    conn.close()
    return {"daily":[dict(r) for r in rows]}


@router.get("/trends/hourly")
def hourly():
    conn = get_connection(); c = conn.cursor()
    rows = c.execute("""SELECT CAST(strftime('%H',timestamp) AS INTEGER) as hour,
        COUNT(*) as transactions,AVG(amount) as avg_amount,SUM(is_fraud) as fraud_count
        FROM transactions GROUP BY hour ORDER BY hour""").fetchall()
    conn.close()
    return {"hourly":[dict(r) for r in rows]}


@router.get("/geographic")
def geographic():
    conn = get_connection(); c = conn.cursor()
    rows = c.execute("""SELECT location,COUNT(*) as count,SUM(amount) as volume,
        SUM(is_fraud) as fraud_count,AVG(fraud_score) as avg_fraud_score
        FROM transactions GROUP BY location ORDER BY volume DESC""").fetchall()
    conn.close()
    return {"locations":[dict(r) for r in rows]}


@router.get("/insights")
def insights():
    conn = get_connection(); c = conn.cursor()
    fraud_rate = c.execute("SELECT AVG(is_fraud) FROM transactions").fetchone()[0] or 0
    top_loc    = c.execute("""SELECT location,COUNT(*) as cnt FROM transactions WHERE is_fraud=1
        GROUP BY location ORDER BY cnt DESC LIMIT 1""").fetchone()
    peak_hr    = c.execute("""SELECT CAST(strftime('%H',timestamp) AS INTEGER) as hr,COUNT(*) as cnt
        FROM transactions WHERE is_fraud=1 GROUP BY hr ORDER BY cnt DESC LIMIT 1""").fetchone()
    top_cat    = c.execute("""SELECT category,SUM(amount) as vol FROM transactions
        GROUP BY category ORDER BY vol DESC LIMIT 1""").fetchone()
    conn.close()

    out = []
    sev = "HIGH" if fraud_rate>0.1 else "LOW"
    out.append({"type":"WARNING" if fraud_rate>0.1 else "OK",
                "title":"Elevated Fraud Rate" if fraud_rate>0.1 else "Fraud Rate Normal",
                "message":f"Fraud rate is {fraud_rate*100:.1f}%."
                          + (" Above 10% threshold — tighten velocity rules." if fraud_rate>0.1 else " Within acceptable range."),
                "severity":sev})
    if top_loc:
        out.append({"type":"GEO_ALERT","title":f"High-Risk Location: {top_loc[0]}",
                    "message":f"{top_loc[1]} fraud transactions from {top_loc[0]}. Consider geo-fencing.",
                    "severity":"MEDIUM"})
    if peak_hr:
        out.append({"type":"TEMPORAL","title":f"Fraud Peaks at {peak_hr[0]:02d}:00",
                    "message":f"Most fraud occurs at {peak_hr[0]:02d}:00. Increase monitoring.","severity":"MEDIUM"})
    if top_cat:
        out.append({"type":"INFO","title":f"Top Category: {top_cat[0]}",
                    "message":f"{top_cat[0]} leads in volume at ${top_cat[1]:,.2f}.","severity":"INFO"})
    return {"insights":out}
