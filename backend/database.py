import sqlite3
import random
import json
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "finsight.db"


def get_connection():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = get_connection()
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT NOT NULL,
            email      TEXT UNIQUE,
            risk_tier  TEXT DEFAULT 'MEDIUM',
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS transactions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER,
            amount      REAL NOT NULL,
            merchant    TEXT,
            category    TEXT,
            location    TEXT,
            channel     TEXT,
            status      TEXT DEFAULT 'COMPLETED',
            fraud_score REAL DEFAULT 0.0,
            is_fraud    INTEGER DEFAULT 0,
            timestamp   TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS fraud_alerts (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id INTEGER,
            alert_type     TEXT,
            severity       TEXT,
            confidence     REAL,
            features       TEXT,
            resolved       INTEGER DEFAULT 0,
            created_at     TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (transaction_id) REFERENCES transactions(id)
        );
        CREATE TABLE IF NOT EXISTS risk_profiles (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id        INTEGER UNIQUE,
            credit_score   INTEGER,
            risk_score     REAL,
            velocity_score REAL,
            behavior_score REAL,
            geo_risk       REAL,
            tier           TEXT,
            factors        TEXT,
            updated_at     TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS market_data (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol     TEXT NOT NULL,
            price      REAL,
            change_pct REAL,
            volume     INTEGER,
            sentiment  REAL,
            signal     TEXT,
            timestamp  TEXT DEFAULT (datetime('now'))
        );
    """)
    conn.commit()
    conn.close()


MERCHANTS  = ["Amazon","Walmart","Target","Starbucks","Apple Store","Netflix",
               "Uber","DoorDash","Airbnb","Steam","Best Buy","Shell Gas",
               "CVS Pharmacy","Unknown Vendor","CryptoExchange_XYZ",
               "FastCash ATM","IntlTransfer99"]
CATEGORIES = ["Retail","Food & Dining","Entertainment","Travel","Utilities",
               "Healthcare","Crypto","Cash Withdrawal","Wire Transfer","Subscription"]
LOCATIONS  = ["New York, US","London, UK","Mumbai, IN","Tokyo, JP",
               "Lagos, NG","São Paulo, BR","Sydney, AU","Dubai, UAE","Unknown"]
CHANNELS   = ["mobile_app","web","pos_terminal","atm","api_transfer"]
USERS_DATA = [
    ("Alice Chen",   "alice@fintech.com",  "LOW"),
    ("Bob Martinez", "bob@fintech.com",    "MEDIUM"),
    ("Carol Smith",  "carol@fintech.com",  "HIGH"),
    ("David Kim",    "david@fintech.com",  "LOW"),
    ("Emma Johnson", "emma@fintech.com",   "CRITICAL"),
    ("Frank Lee",    "frank@fintech.com",  "MEDIUM"),
    ("Grace Wang",   "grace@fintech.com",  "LOW"),
    ("Henry Brown",  "henry@fintech.com",  "HIGH"),
]
SYMBOLS     = ["AAPL","GOOGL","MSFT","AMZN","TSLA","BTC-USD","ETH-USD","JPM","GS","V"]
BASE_PRICES = {"AAPL":182,"GOOGL":140,"MSFT":415,"AMZN":178,"TSLA":225,
               "BTC-USD":67000,"ETH-USD":3500,"JPM":198,"GS":445,"V":275}


def seed_data():
    conn = get_connection()
    c = conn.cursor()
    if c.execute("SELECT COUNT(*) FROM users").fetchone()[0] > 0:
        conn.close()
        return

    for name, email, tier in USERS_DATA:
        c.execute("INSERT INTO users (name,email,risk_tier) VALUES (?,?,?)", (name,email,tier))

    base_time = datetime.now() - timedelta(days=30)
    for _ in range(500):
        uid      = random.randint(1, len(USERS_DATA))
        amount   = round(random.lognormvariate(4, 1.5), 2)
        merchant = random.choice(MERCHANTS)
        category = random.choice(CATEGORIES)
        location = random.choice(LOCATIONS)
        channel  = random.choice(CHANNELS)
        ts       = base_time + timedelta(minutes=random.randint(0, 43200))

        is_fraud    = 0
        fraud_score = round(random.uniform(0.01, 0.25), 3)
        if merchant in ["Unknown Vendor","CryptoExchange_XYZ","FastCash ATM","IntlTransfer99"]:
            if amount > 1000:
                is_fraud    = random.choices([0,1], weights=[0.4,0.6])[0]
                fraud_score = round(random.uniform(0.65, 0.99), 3)
            else:
                fraud_score = round(random.uniform(0.35, 0.70), 3)

        status = "FLAGGED" if is_fraud else random.choice(["COMPLETED","COMPLETED","COMPLETED","PENDING"])
        c.execute("""INSERT INTO transactions
            (user_id,amount,merchant,category,location,channel,status,fraud_score,is_fraud,timestamp)
            VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (uid,amount,merchant,category,location,channel,status,fraud_score,is_fraud,ts.isoformat()))

    c.execute("SELECT id,fraud_score FROM transactions WHERE is_fraud=1")
    for txn in c.fetchall():
        severity = random.choice(["CRITICAL","HIGH","MEDIUM"])
        features = json.dumps({"amount_zscore": round(random.uniform(2.5,5.0),2),
                                "velocity_ratio": round(random.uniform(3.0,10.0),2)})
        c.execute("""INSERT INTO fraud_alerts (transaction_id,alert_type,severity,confidence,features)
            VALUES (?,?,?,?,?)""",
            (txn[0], random.choice(["VELOCITY_SPIKE","GEO_ANOMALY","AMOUNT_OUTLIER","BEHAVIOR_DEVIATION","DEVICE_MISMATCH"]),
             severity, txn[1], features))

    tier_map = {"LOW":(0.05,0.25),"MEDIUM":(0.3,0.55),"HIGH":(0.6,0.79),"CRITICAL":(0.8,0.99)}
    for i,(name,email,tier) in enumerate(USERS_DATA,1):
        lo,hi = tier_map[tier]
        cs = random.randint(300,850)
        rs = round(random.uniform(lo,hi),3)
        factors = json.dumps(["high_velocity" if tier in ("HIGH","CRITICAL") else "stable_history",
                               "low_credit" if cs<500 else "good_credit"])
        c.execute("""INSERT INTO risk_profiles
            (user_id,credit_score,risk_score,velocity_score,behavior_score,geo_risk,tier,factors)
            VALUES (?,?,?,?,?,?,?,?)""",
            (i,cs,rs,round(random.uniform(lo,hi),3),round(random.uniform(lo,hi),3),
             round(random.uniform(0.1,0.9),3),tier,factors))

    for symbol,base in BASE_PRICES.items():
        price = base
        for j in range(60):
            price = round(price * random.uniform(0.985,1.015),2)
            ts    = (datetime.now()-timedelta(hours=60-j)).isoformat()
            c.execute("""INSERT INTO market_data (symbol,price,change_pct,volume,sentiment,signal,timestamp)
                VALUES (?,?,?,?,?,?,?)""",
                (symbol,price,round(random.uniform(-5,5),2),random.randint(100000,5000000),
                 round(random.uniform(-1,1),3),random.choice(["BUY","HOLD","SELL"]),ts))

    conn.commit()
    conn.close()
    print("✅ Database seeded with 500 transactions!")
