from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_connection
from services.ml_service import predict_fraud
import json

router = APIRouter()


class TransactionCreate(BaseModel):
    user_id:  int
    amount:   float
    merchant: str
    category: str
    location: str = "Unknown"
    channel:  str = "web"


@router.get("/")
def get_transactions(limit: int = Query(50, le=200), offset: int = 0,
                     status: Optional[str] = None, is_fraud: Optional[int] = None):
    conn = get_connection(); c = conn.cursor()
    q = "SELECT t.*,u.name as user_name FROM transactions t JOIN users u ON t.user_id=u.id WHERE 1=1"
    p = []
    if status:   q += " AND t.status=?";   p.append(status)
    if is_fraud is not None: q += " AND t.is_fraud=?"; p.append(is_fraud)
    q += " ORDER BY t.timestamp DESC LIMIT ? OFFSET ?"; p.extend([limit,offset])
    rows  = c.execute(q,p).fetchall()
    total = c.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
    conn.close()
    return {"transactions":[dict(r) for r in rows],"total":total}


@router.post("/")
def create_transaction(txn: TransactionCreate):
    res       = predict_fraud(txn.amount,txn.merchant,txn.category,txn.location,txn.channel)
    is_fraud  = res["is_fraud"]; score = res["fraud_probability"]
    status    = "FLAGGED" if is_fraud else "COMPLETED"
    conn      = get_connection(); c = conn.cursor()
    c.execute("""INSERT INTO transactions
        (user_id,amount,merchant,category,location,channel,status,fraud_score,is_fraud)
        VALUES (?,?,?,?,?,?,?,?,?)""",
        (txn.user_id,txn.amount,txn.merchant,txn.category,txn.location,txn.channel,status,score,is_fraud))
    tid = c.lastrowid
    if is_fraud:
        c.execute("""INSERT INTO fraud_alerts (transaction_id,alert_type,severity,confidence,features)
            VALUES (?,?,?,?,?)""",
            (tid,"ML_DETECTION",res["risk_level"],score,json.dumps(res["top_factors"])))
    conn.commit(); conn.close()
    return {"id":tid,"status":status,"fraud_analysis":res}


@router.get("/stats/summary")
def summary():
    conn = get_connection(); c = conn.cursor()
    total = c.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
    vol   = c.execute("SELECT COALESCE(SUM(amount),0) FROM transactions").fetchone()[0]
    fraud = c.execute("SELECT COUNT(*) FROM transactions WHERE is_fraud=1").fetchone()[0]
    daily = c.execute("""SELECT date(timestamp) as day,COUNT(*) as count,SUM(amount) as volume,SUM(is_fraud) as frauds
        FROM transactions WHERE timestamp>=date('now','-7 days')
        GROUP BY date(timestamp) ORDER BY day""").fetchall()
    cats  = c.execute("""SELECT category,COUNT(*) as count,SUM(amount) as volume
        FROM transactions GROUP BY category ORDER BY volume DESC""").fetchall()
    conn.close()
    return {"total_transactions":total,"total_volume":round(vol,2),
            "fraud_count":fraud,"fraud_rate":round(fraud/max(total,1),4),
            "daily_trend":[dict(d) for d in daily],
            "category_breakdown":[dict(c) for c in cats]}


@router.get("/{txn_id}")
def get_transaction(txn_id: int):
    conn = get_connection(); c = conn.cursor()
    row  = c.execute("SELECT t.*,u.name as user_name FROM transactions t JOIN users u ON t.user_id=u.id WHERE t.id=?",
                     (txn_id,)).fetchone()
    conn.close()
    if not row: raise HTTPException(404,"Not found")
    return dict(row)
