from fastapi import APIRouter
from database import get_connection
from services.ml_service import compute_risk_score
import json

router = APIRouter()


@router.get("/")
def all_profiles():
    conn = get_connection(); c = conn.cursor()
    rows = c.execute("""SELECT rp.*,u.name,u.email FROM risk_profiles rp
        JOIN users u ON rp.user_id=u.id ORDER BY rp.risk_score DESC""").fetchall()
    conn.close()
    out = []
    for r in rows:
        d = dict(r)
        try: d["factors"] = json.loads(d["factors"])
        except: pass
        out.append(d)
    return {"profiles": out}


@router.get("/summary/tiers")
def tiers():
    conn = get_connection(); c = conn.cursor()
    rows = c.execute("SELECT tier,COUNT(*) as count,AVG(risk_score) as avg_score FROM risk_profiles GROUP BY tier").fetchall()
    conn.close()
    return {"tiers":[dict(r) for r in rows]}


@router.get("/{user_id}")
def user_risk(user_id: int):
    return compute_risk_score(user_id)
