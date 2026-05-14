from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager

from database import init_db, seed_data
from routers import transactions, fraud, risk, market, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_data()
    print("✅ FinSight AI Backend Started!")
    print("📊 Open Swagger docs: http://localhost:8000/docs")
    yield


app = FastAPI(
    title="FinSight AI",
    description="Real-time FinTech Analytics with AI Fraud Detection",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(fraud.router,        prefix="/api/fraud",        tags=["Fraud"])
app.include_router(risk.router,         prefix="/api/risk",         tags=["Risk"])
app.include_router(market.router,       prefix="/api/market",       tags=["Market"])
app.include_router(analytics.router,    prefix="/api/analytics",    tags=["Analytics"])


@app.get("/")
def root():
    return {"app": "FinSight AI", "status": "running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
