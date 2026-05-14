from fastapi import APIRouter, Query
from database import get_connection

router = APIRouter()


@router.get("/overview")
def overview():
    conn = get_connection(); c = conn.cursor()
    rows = c.execute("""SELECT m1.symbol,m1.price,m1.change_pct,m1.volume,m1.sentiment,m1.signal,m1.timestamp
        FROM market_data m1 INNER JOIN
        (SELECT symbol,MAX(timestamp) as max_ts FROM market_data GROUP BY symbol) m2
        ON m1.symbol=m2.symbol AND m1.timestamp=m2.max_ts""").fetchall()
    conn.close()
    return {"assets":[dict(r) for r in rows]}


@router.get("/sentiment/summary")
def sentiment():
    conn = get_connection(); c = conn.cursor()
    rows = c.execute("""SELECT m1.symbol,m1.sentiment,m1.signal FROM market_data m1 INNER JOIN
        (SELECT symbol,MAX(timestamp) as max_ts FROM market_data GROUP BY symbol) m2
        ON m1.symbol=m2.symbol AND m1.timestamp=m2.max_ts""").fetchall()
    conn.close()
    data     = [dict(r) for r in rows]
    bullish  = [r["symbol"] for r in data if r["sentiment"]>0.2]
    bearish  = [r["symbol"] for r in data if r["sentiment"]<-0.2]
    return {"bullish_count":len(bullish),"bearish_count":len(bearish),
            "bullish_assets":bullish,"bearish_assets":bearish}


@router.get("/{symbol}/history")
def history(symbol: str, points: int = Query(30, le=60)):
    conn = get_connection(); c = conn.cursor()
    rows = c.execute("""SELECT price,change_pct,volume,sentiment,signal,timestamp
        FROM market_data WHERE symbol=? ORDER BY timestamp DESC LIMIT ?""",
        (symbol.upper(),points)).fetchall()
    conn.close()
    return {"symbol":symbol.upper(),"history":[dict(r) for r in reversed(rows)]}
