import numpy as np
import json
import warnings
warnings.filterwarnings("ignore")

from database import get_connection
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

_fraud_model   = None
_scaler        = None
_label_encoders = {}


def _load_rows():
    conn = get_connection()
    rows = conn.cursor().execute("""
        SELECT amount, merchant, category, location, channel,
               CAST(strftime('%H', timestamp) AS INTEGER) as hour,
               CAST(strftime('%w', timestamp) AS INTEGER) as dow,
               is_fraud
        FROM transactions
    """).fetchall()
    conn.close()
    return rows


def _encode(rows):
    global _label_encoders
    for col, idx in [("merchant",1),("category",2),("location",3),("channel",4)]:
        vals = [r[idx] for r in rows]
        if col not in _label_encoders:
            le = LabelEncoder()
            le.fit(vals)
            _label_encoders[col] = le

    X, y = [], []
    for r in rows:
        try:
            X.append([r[0],
                      _label_encoders["merchant"].transform([r[1]])[0],
                      _label_encoders["category"].transform([r[2]])[0],
                      _label_encoders["location"].transform([r[3]])[0],
                      _label_encoders["channel"].transform([r[4]])[0],
                      r[5], r[6]])
            y.append(r[7])
        except Exception:
            continue
    return np.array(X), np.array(y)


def train_fraud_model():
    global _fraud_model, _scaler
    rows = _load_rows()
    if len(rows) < 50:
        return {"status": "insufficient_data"}
    X, y = _encode(rows)
    _scaler = StandardScaler()
    Xs = _scaler.fit_transform(X)
    Xtr, Xte, ytr, yte = train_test_split(Xs, y, test_size=0.2, random_state=42)
    rf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42, class_weight="balanced")
    rf.fit(Xtr, ytr)
    _fraud_model = rf
    try:
        auc = round(roc_auc_score(yte, rf.predict_proba(Xte)[:,1]), 4)
    except Exception:
        auc = 0.0
    FEATS = ["amount","merchant","category","location","channel","hour","dow"]
    return {"status":"trained","samples":len(rows),"auc_roc":auc,
            "feature_importances": dict(zip(FEATS,[round(v,4) for v in rf.feature_importances_]))}


def predict_fraud(amount, merchant, category, location, channel):
    global _fraud_model, _scaler, _label_encoders
    if _fraud_model is None:
        train_fraud_model()

    def enc(col, val):
        le = _label_encoders.get(col)
        if le is None: return 0
        return le.transform([val])[0] if val in le.classes_ else len(le.classes_)-1

    from datetime import datetime
    now = datetime.now()
    feat = np.array([[amount, enc("merchant",merchant), enc("category",category),
                      enc("location",location), enc("channel",channel),
                      now.hour, now.weekday()]])
    if _scaler:
        feat = _scaler.transform(feat)

    proba = float(_fraud_model.predict_proba(feat)[0][1])
    risk  = "LOW" if proba<0.3 else "MEDIUM" if proba<0.6 else "HIGH" if proba<0.85 else "CRITICAL"
    FEATS = ["amount","merchant","category","location","channel","hour","dow"]
    factors = sorted(zip(FEATS,_fraud_model.feature_importances_), key=lambda x:-x[1])[:3]

    return {"fraud_probability": round(proba,4), "is_fraud": int(proba>0.5),
            "risk_level": risk,
            "top_factors": [{"feature":f,"importance":round(v,4)} for f,v in factors],
            "model": "RandomForest_v2"}


def compute_risk_score(user_id):
    conn = get_connection()
    c    = conn.cursor()
    txns = c.execute("""SELECT amount,is_fraud,fraud_score,timestamp
        FROM transactions WHERE user_id=? ORDER BY timestamp DESC LIMIT 100""",
        (user_id,)).fetchall()
    profile = c.execute("SELECT * FROM risk_profiles WHERE user_id=?", (user_id,)).fetchone()
    conn.close()

    if not txns:
        return {"user_id":user_id,"risk_score":0.5,"tier":"MEDIUM"}

    amounts      = [t[0] for t in txns]
    fraud_flags  = [t[1] for t in txns]
    fraud_scores = [t[2] for t in txns]

    from datetime import datetime, timedelta
    cutoff  = (datetime.now()-timedelta(hours=24)).isoformat()
    recent  = [t for t in txns if t[3]>cutoff]
    vel     = min(len(recent)/max(len(txns)*0.1,1),1.0)

    mean_a  = np.mean(amounts); std_a = np.std(amounts)+1e-9
    amt_z   = min(abs((amounts[0]-mean_a)/std_a)/5.0,1.0)

    fraud_rate = sum(fraud_flags)/len(fraud_flags)
    avg_fs     = np.mean(fraud_scores)
    composite  = round(float(np.clip(0.35*avg_fs+0.25*fraud_rate+0.20*vel+0.20*amt_z,0,1)),4)
    tier       = "LOW" if composite<0.25 else "MEDIUM" if composite<0.5 else "HIGH" if composite<0.75 else "CRITICAL"

    factors = []
    if vel>0.6:        factors.append("HIGH_VELOCITY")
    if fraud_rate>0.1: factors.append("FRAUD_HISTORY")
    if amt_z>0.5:      factors.append("AMOUNT_ANOMALY")
    if avg_fs>0.5:     factors.append("SUSPICIOUS_PATTERNS")
    if not factors:    factors.append("NORMAL_BEHAVIOR")

    return {"user_id":user_id,"risk_score":composite,"tier":tier,
            "velocity_score":round(vel,4),"fraud_rate":round(fraud_rate,4),
            "avg_fraud_score":round(avg_fs,4),"risk_factors":factors,
            "credit_score": profile["credit_score"] if profile else None}


def get_model_stats():
    if _fraud_model is None:
        return train_fraud_model()
    rows = _load_rows()
    X, y = _encode(rows)
    if _scaler: X = _scaler.transform(X)
    try:
        auc = round(roc_auc_score(y, _fraud_model.predict_proba(X)[:,1]),4)
    except Exception:
        auc = 0.0
    FEATS = ["amount","merchant","category","location","channel","hour","dow"]
    return {"model":"RandomForest_v2","total_samples":len(rows),
            "fraud_samples":int(sum(y)),"auc_roc":auc,
            "feature_importances": dict(zip(FEATS,[round(v,4) for v in _fraud_model.feature_importances_]))}
