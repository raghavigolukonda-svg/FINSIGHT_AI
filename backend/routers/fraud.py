from fastapi import APIRouter, Query
from pydantic import BaseModel
from database import get_connection
from services.ml_service import predict_fraud, train_fraud_model, get_model_stats
import json

router = APIRouter()


class FraudCheckRequest(BaseModel):
    amount:   float
    merchant: str
    category: str
    location: str = "Unknown"
    channel:  str = "web"


@router.post("/check")
def check(req: FraudCheckRequest):
    return predict_fraud(req.amount,req.merchant,req.category,req.location,req.channel)


@router.get("/alerts")
def alerts(limit: int = Query(50,le=100), resolved: int = 0):
    conn = get_connection(); c = conn.cursor()
    rows = c.execute("""SELECT fa.*,t.amount,t.merchant,t.timestamp as txn_time,u.name as user_name
        FROM fraud_alerts fa JOIN transactions t ON fa.transaction_id=t.id
        JOIN users u ON t.user_id=u.id WHERE fa.resolved=?
        ORDER BY fa.created_at DESC LIMIT ?""", (resolved,limit)).fetchall()
    conn.close()
    out = []
    for r in rows:
        d = dict(r)
        try: d["features"] = json.loads(d["features"])
        except: pass
        out.append(d)
    return {"alerts":out,"count":len(out)}


@router.put("/alerts/{alert_id}/resolve")
def resolve(alert_id: int):
    conn = get_connection(); c = conn.cursor()
    c.execute("UPDATE fraud_alerts SET resolved=1 WHERE id=?", (alert_id,))
    conn.commit(); conn.close()
    return {"status":"resolved","alert_id":alert_id}


@router.get("/stats")
def stats():
    conn = get_connection(); c = conn.cursor()
    by_sev  = c.execute("SELECT severity,COUNT(*) as count FROM fraud_alerts GROUP BY severity").fetchall()
    by_type = c.execute("SELECT alert_type,COUNT(*) as count FROM fraud_alerts GROUP BY alert_type").fetchall()
    top_m   = c.execute("""SELECT merchant,COUNT(*) as fraud_count,AVG(fraud_score) as avg_score
        FROM transactions WHERE is_fraud=1 GROUP BY merchant ORDER BY fraud_count DESC LIMIT 10""").fetchall()
    conn.close()
    return {"by_severity":[dict(r) for r in by_sev],
            "by_type":[dict(r) for r in by_type],
            "top_fraud_merchants":[dict(r) for r in top_m]}


@router.post("/model/train")
def retrain():
    return train_fraud_model()


@router.get("/model/stats")
def model_stats():
    return get_model_stats()
