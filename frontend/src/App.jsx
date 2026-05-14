import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";

// ── Colours ──────────────────────────────────────────────────────────────────
const AMBER="#F59E0B",RED="#EF4444",GREEN="#10B981",BLUE="#3B82F6",CYAN="#06B6D4";
const BG_DEEP="#050709",BG_CARD="#0C0F14",BG_PANEL="#111520",BORDER="#1E2535";
const TEXT_DIM="#4B5563",TEXT_MID="#9CA3AF",TEXT_BRIGHT="#E5E7EB";
const TIER_COL={LOW:GREEN,MEDIUM:AMBER,HIGH:"#F97316",CRITICAL:RED};
const SEV_COL ={CRITICAL:RED,HIGH:"#F97316",MEDIUM:AMBER,LOW:GREEN,INFO:BLUE};
const SIG_COL ={BUY:GREEN,HOLD:AMBER,SELL:RED};

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_KPIS={total_transactions:500,total_volume:2847392.45,fraud_count:63,
  fraud_rate_pct:12.6,open_alerts:18,avg_transaction_value:5694.78,
  critical_risk_users:1,high_risk_users:2,volume_change_pct:4.7};

const MOCK_DAILY=Array.from({length:30},(_,i)=>{
  const d=new Date();d.setDate(d.getDate()-29+i);
  return{day:d.toISOString().slice(5,10),
    transactions:Math.floor(10+Math.random()*25),
    volume:Math.round(50000+Math.random()*150000),
    fraud_count:Math.floor(Math.random()*5)};
});

const MOCK_HOURLY=Array.from({length:24},(_,h)=>({
  hour:h,transactions:Math.floor(5+Math.random()*30),
  fraud_count:Math.floor(Math.random()*(h>=1&&h<=5?5:2)),
  avg_amount:Math.round(200+Math.random()*1800)}));

const MOCK_ALERTS=[
  {id:1,alert_type:"VELOCITY_SPIKE",severity:"CRITICAL",confidence:0.97,merchant:"CryptoExchange_XYZ",amount:8450,user_name:"Emma Johnson",created_at:"2024-06-01T02:14:00"},
  {id:2,alert_type:"GEO_ANOMALY",severity:"HIGH",confidence:0.88,merchant:"Unknown Vendor",amount:3200,user_name:"Carol Smith",created_at:"2024-06-01T04:32:00"},
  {id:3,alert_type:"AMOUNT_OUTLIER",severity:"HIGH",confidence:0.82,merchant:"FastCash ATM",amount:9999,user_name:"Henry Brown",created_at:"2024-06-01T07:45:00"},
  {id:4,alert_type:"BEHAVIOR_DEVIATION",severity:"MEDIUM",confidence:0.74,merchant:"IntlTransfer99",amount:1890,user_name:"Bob Martinez",created_at:"2024-06-01T11:20:00"},
  {id:5,alert_type:"DEVICE_MISMATCH",severity:"MEDIUM",confidence:0.69,merchant:"Steam",amount:450,user_name:"Frank Lee",created_at:"2024-06-01T14:05:00"},
];

const MOCK_TXNS=[
  {id:1,user_name:"Alice Chen",amount:124.5,merchant:"Amazon",category:"Retail",status:"COMPLETED",fraud_score:0.04,timestamp:"2024-06-01T10:12:00"},
  {id:2,user_name:"Emma Johnson",amount:8450,merchant:"CryptoExchange_XYZ",category:"Crypto",status:"FLAGGED",fraud_score:0.97,timestamp:"2024-06-01T02:14:00"},
  {id:3,user_name:"Bob Martinez",amount:55.9,merchant:"Starbucks",category:"Food & Dining",status:"COMPLETED",fraud_score:0.03,timestamp:"2024-06-01T08:30:00"},
  {id:4,user_name:"Carol Smith",amount:3200,merchant:"Unknown Vendor",category:"Cash Withdrawal",status:"FLAGGED",fraud_score:0.88,timestamp:"2024-06-01T04:32:00"},
  {id:5,user_name:"David Kim",amount:299.99,merchant:"Apple Store",category:"Retail",status:"COMPLETED",fraud_score:0.07,timestamp:"2024-06-01T13:45:00"},
  {id:6,user_name:"Henry Brown",amount:9999,merchant:"FastCash ATM",category:"Cash Withdrawal",status:"FLAGGED",fraud_score:0.91,timestamp:"2024-06-01T07:45:00"},
  {id:7,user_name:"Grace Wang",amount:18.99,merchant:"Netflix",category:"Subscription",status:"COMPLETED",fraud_score:0.01,timestamp:"2024-06-01T09:00:00"},
  {id:8,user_name:"Frank Lee",amount:1890,merchant:"IntlTransfer99",category:"Wire Transfer",status:"FLAGGED",fraud_score:0.74,timestamp:"2024-06-01T11:20:00"},
];

const MOCK_RISK=[
  {user_id:5,name:"Emma Johnson",tier:"CRITICAL",risk_score:0.92,credit_score:340,velocity_score:0.95,fraud_rate:0.42},
  {user_id:3,name:"Carol Smith",tier:"HIGH",risk_score:0.74,credit_score:520,velocity_score:0.71,fraud_rate:0.18},
  {user_id:8,name:"Henry Brown",tier:"HIGH",risk_score:0.67,credit_score:580,velocity_score:0.63,fraud_rate:0.15},
  {user_id:2,name:"Bob Martinez",tier:"MEDIUM",risk_score:0.44,credit_score:680,velocity_score:0.38,fraud_rate:0.06},
  {user_id:6,name:"Frank Lee",tier:"MEDIUM",risk_score:0.38,credit_score:710,velocity_score:0.31,fraud_rate:0.04},
  {user_id:1,name:"Alice Chen",tier:"LOW",risk_score:0.12,credit_score:820,velocity_score:0.08,fraud_rate:0.0},
  {user_id:4,name:"David Kim",tier:"LOW",risk_score:0.09,credit_score:810,velocity_score:0.07,fraud_rate:0.0},
  {user_id:7,name:"Grace Wang",tier:"LOW",risk_score:0.07,credit_score:840,velocity_score:0.05,fraud_rate:0.0},
];

const MOCK_MARKET=[
  {symbol:"AAPL",price:187.42,change_pct:1.24,sentiment:0.6,signal:"BUY",volume:2340000},
  {symbol:"GOOGL",price:142.88,change_pct:-0.87,sentiment:0.1,signal:"HOLD",volume:1820000},
  {symbol:"MSFT",price:418.55,change_pct:0.53,sentiment:0.72,signal:"BUY",volume:3100000},
  {symbol:"TSLA",price:218.30,change_pct:-2.14,sentiment:-0.41,signal:"SELL",volume:5600000},
  {symbol:"BTC-USD",price:68420,change_pct:3.12,sentiment:0.55,signal:"BUY",volume:890000},
  {symbol:"ETH-USD",price:3580,change_pct:1.88,sentiment:0.48,signal:"BUY",volume:420000},
  {symbol:"JPM",price:201.35,change_pct:0.21,sentiment:0.3,signal:"HOLD",volume:1200000},
  {symbol:"GS",price:448.90,change_pct:-0.44,sentiment:-0.12,signal:"HOLD",volume:780000},
];

const MOCK_INSIGHTS=[
  {type:"WARNING",title:"Elevated Fraud Rate Detected",message:"Current fraud rate is 12.6%, above 10% threshold. Tighten velocity rules.",severity:"HIGH"},
  {type:"GEO_ALERT",title:"High-Risk Location: Unknown",message:"29 fraud transactions from Unknown location. Consider geo-fencing.",severity:"MEDIUM"},
  {type:"TEMPORAL",title:"Fraud Peaks at 02:00",message:"Most fraud occurs at 02:00. Increase monitoring during this window.",severity:"MEDIUM"},
  {type:"INFO",title:"Top Revenue: Crypto",message:"Crypto category leads volume at $284,739. Monitor closely.",severity:"INFO"},
];

const MOCK_FRAUD_STATS={
  by_severity:[{severity:"CRITICAL",count:8},{severity:"HIGH",count:22},{severity:"MEDIUM",count:33}],
  by_type:[{alert_type:"VELOCITY_SPIKE",count:18},{alert_type:"GEO_ANOMALY",count:14},
           {alert_type:"AMOUNT_OUTLIER",count:15},{alert_type:"BEHAVIOR_DEVIATION",count:9},{alert_type:"DEVICE_MISMATCH",count:7}],
  top_fraud_merchants:[{merchant:"CryptoExchange_XYZ",fraud_count:21,avg_score:0.91},
    {merchant:"Unknown Vendor",fraud_count:17,avg_score:0.86},
    {merchant:"FastCash ATM",fraud_count:14,avg_score:0.84},
    {merchant:"IntlTransfer99",fraud_count:11,avg_score:0.79}],
};

// ── Shared UI components ──────────────────────────────────────────────────────
const Badge=({label,color})=>(
  <span style={{display:"inline-block",padding:"2px 8px",borderRadius:3,fontSize:10,
    fontWeight:700,letterSpacing:"0.08em",color,border:`1px solid ${color}22`,background:`${color}14`}}>
    {label}
  </span>
);

const KPICard=({title,value,sub,delta,color=AMBER,icon})=>(
  <div style={{background:BG_CARD,border:`1px solid ${BORDER}`,borderTop:`2px solid ${color}`,
    borderRadius:6,padding:"18px 20px",display:"flex",flexDirection:"column",gap:6}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontSize:11,color:TEXT_DIM,letterSpacing:"0.1em",textTransform:"uppercase"}}>{title}</span>
      <span style={{fontSize:18,opacity:0.4}}>{icon}</span>
    </div>
    <div style={{fontSize:26,fontWeight:800,color:TEXT_BRIGHT,fontFamily:"monospace",letterSpacing:"-0.02em"}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:TEXT_MID}}>{sub}</div>}
    {delta!==undefined&&<div style={{fontSize:11,color:delta>=0?GREEN:RED,fontFamily:"monospace"}}>
      {delta>=0?"▲":"▼"} {Math.abs(delta)}%
    </div>}
  </div>
);

const SectionHeader=({title,sub})=>(
  <div style={{marginBottom:16}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:3,height:18,background:AMBER,borderRadius:2}}/>
      <h2 style={{margin:0,fontSize:14,fontWeight:700,color:TEXT_BRIGHT,
        letterSpacing:"0.06em",textTransform:"uppercase"}}>{title}</h2>
    </div>
    {sub&&<div style={{fontSize:11,color:TEXT_DIM,marginTop:4,marginLeft:13}}>{sub}</div>}
  </div>
);

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV=[
  {id:"overview",label:"Overview",icon:"⬡"},
  {id:"fraud",label:"Fraud Intel",icon:"⚠"},
  {id:"transactions",label:"Transactions",icon:"⇄"},
  {id:"risk",label:"Risk Profiles",icon:"◈"},
  {id:"market",label:"Market Intel",icon:"◎"},
  {id:"checker",label:"Live Checker",icon:"⚡"},
];

function Sidebar({active,setActive}){
  return(
    <aside style={{width:220,minHeight:"100vh",background:BG_CARD,
      borderRight:`1px solid ${BORDER}`,display:"flex",flexDirection:"column",
      position:"sticky",top:0,flexShrink:0}}>
      <div style={{padding:"24px 20px 20px",borderBottom:`1px solid ${BORDER}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,background:`${AMBER}20`,border:`1px solid ${AMBER}60`,
            borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>◈</div>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:AMBER,letterSpacing:"0.05em"}}>FinSight</div>
            <div style={{fontSize:9,color:TEXT_DIM,letterSpacing:"0.15em",textTransform:"uppercase"}}>AI Platform</div>
          </div>
        </div>
      </div>
      <div style={{padding:"12px 20px",borderBottom:`1px solid ${BORDER}`}}>
        <div style={{display:"flex",alignItems:"center",gap:6,background:`${GREEN}10`,
          border:`1px solid ${GREEN}30`,borderRadius:4,padding:"5px 10px"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:GREEN,animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:10,color:GREEN,letterSpacing:"0.1em"}}>SYSTEM LIVE</span>
        </div>
      </div>
      <nav style={{flex:1,padding:"12px 10px"}}>
        {NAV.map(item=>(
          <button key={item.id} onClick={()=>setActive(item.id)} style={{
            width:"100%",display:"flex",alignItems:"center",gap:10,
            padding:"10px 12px",borderRadius:5,marginBottom:2,
            background:active===item.id?`${AMBER}14`:"transparent",
            border:active===item.id?`1px solid ${AMBER}30`:"1px solid transparent",
            color:active===item.id?AMBER:TEXT_DIM,cursor:"pointer",
            fontSize:13,fontWeight:active===item.id?700:400,textAlign:"left",
            transition:"all 0.15s",letterSpacing:"0.02em"}}>
            <span style={{fontSize:15,opacity:0.8}}>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
      <div style={{padding:"14px 20px",borderTop:`1px solid ${BORDER}`}}>
        <div style={{fontSize:10,color:TEXT_DIM,lineHeight:1.6}}>
          <div style={{color:AMBER,fontWeight:700,marginBottom:2}}>FinSight AI v2.0</div>
          <div>FastAPI · SQLite · ML</div>
          <div>scikit-learn · React · Recharts</div>
        </div>
      </div>
    </aside>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewTab(){
  const k=MOCK_KPIS;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:28}}>
      <div>
        <SectionHeader title="Key Performance Indicators" sub="Real-time metrics from the ML analytics engine"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
          <KPICard title="Total Transactions" value={k.total_transactions.toLocaleString()} icon="⇄" color={BLUE} delta={k.volume_change_pct} sub="All-time processed"/>
          <KPICard title="Transaction Volume" value={`$${(k.total_volume/1e6).toFixed(2)}M`} icon="$" color={GREEN} delta={k.volume_change_pct} sub="Total USD value"/>
          <KPICard title="Fraud Detected" value={k.fraud_count} icon="⚠" color={RED} sub={`${k.fraud_rate_pct}% fraud rate`}/>
          <KPICard title="Open Alerts" value={k.open_alerts} icon="🔔" color={AMBER} sub={`${k.critical_risk_users} critical users`}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginTop:14}}>
          <KPICard title="Avg Transaction" value={`$${k.avg_transaction_value.toLocaleString()}`} icon="≈" color={CYAN} sub="Mean ticket size"/>
          <KPICard title="Critical Risk Users" value={k.critical_risk_users} icon="◈" color={RED} sub="Immediate review"/>
          <KPICard title="High Risk Users" value={k.high_risk_users} icon="◈" color="#F97316" sub="Enhanced monitoring"/>
          <KPICard title="Fraud Rate" value={`${k.fraud_rate_pct}%`} icon="%" color={k.fraud_rate_pct>10?RED:GREEN} sub={k.fraud_rate_pct>10?"Above threshold":"Within limits"}/>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20}}>
        <div style={{background:BG_CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:20}}>
          <SectionHeader title="30-Day Transaction Volume" sub="Daily volume with fraud overlay"/>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MOCK_DAILY} margin={{top:5,right:10,left:-10,bottom:0}}>
              <defs>
                <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BLUE} stopOpacity={0.3}/><stop offset="95%" stopColor={BLUE} stopOpacity={0.02}/>
                </linearGradient>
                <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={RED} stopOpacity={0.4}/><stop offset="95%" stopColor={RED} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
              <XAxis dataKey="day" stroke={TEXT_DIM} tick={{fontSize:10}} interval={4}/>
              <YAxis stroke={TEXT_DIM} tick={{fontSize:10}}/>
              <Tooltip contentStyle={{background:BG_PANEL,border:`1px solid ${BORDER}`,fontSize:12}} labelStyle={{color:AMBER}}/>
              <Area type="monotone" dataKey="volume" stroke={BLUE} fill="url(#vg)" strokeWidth={2} name="Volume ($)"/>
              <Area type="monotone" dataKey="fraud_count" stroke={RED} fill="url(#fg)" strokeWidth={1.5} name="Fraud Count"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:BG_CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:20}}>
          <SectionHeader title="Fraud Severity" sub="Alert distribution"/>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={MOCK_FRAUD_STATS.by_severity} dataKey="count" nameKey="severity"
                cx="50%" cy="50%" outerRadius={65} innerRadius={35} paddingAngle={3}>
                {MOCK_FRAUD_STATS.by_severity.map((e,i)=>(
                  <Cell key={e.severity} fill={SEV_COL[e.severity]||["#3B82F6","#06B6D4","#8B5CF6"][i]}/>
                ))}
              </Pie>
              <Tooltip contentStyle={{background:BG_PANEL,border:`1px solid ${BORDER}`,fontSize:12}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",flexDirection:"column",gap:5,marginTop:6}}>
            {MOCK_FRAUD_STATS.by_severity.map(s=>(
              <div key={s.severity} style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:8,height:8,borderRadius:2,background:SEV_COL[s.severity]}}/>
                  <span style={{color:TEXT_MID}}>{s.severity}</span>
                </div>
                <span style={{color:TEXT_BRIGHT,fontFamily:"monospace",fontWeight:700}}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:20}}>
        <div style={{background:BG_CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:20}}>
          <SectionHeader title="Hourly Fraud Pattern" sub="Fraud activity by hour of day"/>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MOCK_HOURLY} margin={{top:5,right:10,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false}/>
              <XAxis dataKey="hour" stroke={TEXT_DIM} tick={{fontSize:9}} tickFormatter={h=>`${h}h`}/>
              <YAxis stroke={TEXT_DIM} tick={{fontSize:10}}/>
              <Tooltip contentStyle={{background:BG_PANEL,border:`1px solid ${BORDER}`,fontSize:12}} labelStyle={{color:AMBER}} labelFormatter={h=>`Hour: ${h}:00`}/>
              <Bar dataKey="transactions" fill={`${BLUE}60`} name="Transactions" radius={[2,2,0,0]}/>
              <Bar dataKey="fraud_count" fill={RED} name="Fraud" radius={[2,2,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:BG_CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:20}}>
          <SectionHeader title="AI Insights" sub="ML-generated observations"/>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {MOCK_INSIGHTS.map((ins,i)=>(
              <div key={i} style={{background:BG_PANEL,border:`1px solid ${SEV_COL[ins.severity]}30`,
                borderLeft:`3px solid ${SEV_COL[ins.severity]}`,borderRadius:4,padding:"10px 12px"}}>
                <div style={{fontSize:11,fontWeight:700,color:SEV_COL[ins.severity],marginBottom:3}}>{ins.title}</div>
                <div style={{fontSize:10,color:TEXT_MID,lineHeight:1.5}}>{ins.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Fraud Intel ───────────────────────────────────────────────────────────────
function FraudTab(){
  const [resolved,setResolved]=useState(new Set());
  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div style={{background:BG_CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:20}}>
          <SectionHeader title="Fraud Alert Types" sub="Detection categories"/>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MOCK_FRAUD_STATS.by_type} layout="vertical" margin={{left:10,right:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false}/>
              <XAxis type="number" stroke={TEXT_DIM} tick={{fontSize:10}}/>
              <YAxis type="category" dataKey="alert_type" stroke={TEXT_DIM} tick={{fontSize:9}} width={115}/>
              <Tooltip contentStyle={{background:BG_PANEL,border:`1px solid ${BORDER}`,fontSize:12}}/>
              <Bar dataKey="count" fill={AMBER} radius={[0,3,3,0]} name="Alerts"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:BG_CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:20}}>
          <SectionHeader title="Top Fraud Merchants" sub="Highest-frequency sources"/>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:8}}>
            {MOCK_FRAUD_STATS.top_fraud_merchants.map((m,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:11,color:TEXT_DIM,width:16,textAlign:"right",fontFamily:"monospace"}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,color:TEXT_BRIGHT}}>{m.merchant}</span>
                    <span style={{fontSize:11,color:RED,fontFamily:"monospace"}}>{m.fraud_count} cases</span>
                  </div>
                  <div style={{height:4,background:BORDER,borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${(m.fraud_count/21)*100}%`,background:RED,borderRadius:2}}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{background:BG_CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:20}}>
        <SectionHeader title="Live Fraud Alerts" sub="Unresolved ML-detected events"/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${BORDER}`}}>
                {["ID","Type","Severity","Confidence","Merchant","Amount","User","Time","Action"].map(h=>(
                  <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,color:TEXT_DIM,
                    letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:600}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_ALERTS.filter(a=>!resolved.has(a.id)).map(a=>(
                <tr key={a.id} style={{borderBottom:`1px solid ${BORDER}22`}}
                  onMouseEnter={e=>e.currentTarget.style.background=BG_PANEL}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"10px 12px",color:TEXT_DIM,fontFamily:"monospace"}}>#{a.id}</td>
                  <td style={{padding:"10px 12px",color:TEXT_MID,fontSize:11}}>{a.alert_type}</td>
                  <td style={{padding:"10px 12px"}}><Badge label={a.severity} color={SEV_COL[a.severity]}/></td>
                  <td style={{padding:"10px 12px",fontFamily:"monospace",color:a.confidence>0.85?RED:AMBER}}>{(a.confidence*100).toFixed(0)}%</td>
                  <td style={{padding:"10px 12px",color:TEXT_BRIGHT}}>{a.merchant}</td>
                  <td style={{padding:"10px 12px",fontFamily:"monospace",color:GREEN}}>${a.amount.toLocaleString()}</td>
                  <td style={{padding:"10px 12px",color:TEXT_MID}}>{a.user_name}</td>
                  <td style={{padding:"10px 12px",color:TEXT_DIM,fontSize:10}}>{a.created_at.slice(0,16).replace("T"," ")}</td>
                  <td style={{padding:"10px 12px"}}>
                    <button onClick={()=>setResolved(p=>new Set([...p,a.id]))} style={{
                      padding:"4px 10px",fontSize:10,borderRadius:3,background:`${GREEN}14`,
                      border:`1px solid ${GREEN}40`,color:GREEN,cursor:"pointer",fontWeight:700}}>
                      RESOLVE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {MOCK_ALERTS.filter(a=>!resolved.has(a.id)).length===0&&(
            <div style={{textAlign:"center",padding:40,color:GREEN}}>✅ All alerts resolved</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Transactions ──────────────────────────────────────────────────────────────
function TransactionsTab(){
  const [filter,setFilter]=useState("ALL");
  const filtered=filter==="ALL"?MOCK_TXNS:MOCK_TXNS.filter(t=>t.status===filter);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {["ALL","COMPLETED","FLAGGED"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:"7px 16px",fontSize:11,borderRadius:4,fontWeight:700,
            letterSpacing:"0.08em",cursor:"pointer",transition:"all 0.15s",
            background:filter===f?`${AMBER}20`:"transparent",
            border:filter===f?`1px solid ${AMBER}60`:`1px solid ${BORDER}`,
            color:filter===f?AMBER:TEXT_DIM}}>{f}</button>
        ))}
        <div style={{marginLeft:"auto",fontSize:11,color:TEXT_DIM}}>{filtered.length} transactions</div>
      </div>
      <div style={{background:BG_CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:20}}>
        <SectionHeader title="Transaction Ledger" sub="Real-time fraud-scored feed"/>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{borderBottom:`1px solid ${BORDER}`}}>
              {["ID","User","Amount","Merchant","Category","Status","Fraud Score","Time"].map(h=>(
                <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,color:TEXT_DIM,
                  letterSpacing:"0.1em",fontWeight:600,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(t=>(
              <tr key={t.id} style={{borderBottom:`1px solid ${BORDER}22`}}
                onMouseEnter={e=>e.currentTarget.style.background=BG_PANEL}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"10px 12px",color:TEXT_DIM,fontFamily:"monospace",fontSize:11}}>#{t.id}</td>
                <td style={{padding:"10px 12px",color:TEXT_BRIGHT}}>{t.user_name}</td>
                <td style={{padding:"10px 12px",fontFamily:"monospace",color:GREEN,fontWeight:700}}>${t.amount.toLocaleString()}</td>
                <td style={{padding:"10px 12px",color:TEXT_MID}}>{t.merchant}</td>
                <td style={{padding:"10px 12px",color:TEXT_DIM,fontSize:11}}>{t.category}</td>
                <td style={{padding:"10px 12px"}}><Badge label={t.status} color={t.status==="FLAGGED"?RED:t.status==="PENDING"?AMBER:GREEN}/></td>
                <td style={{padding:"10px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{width:50,height:4,background:BORDER,borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${t.fraud_score*100}%`,
                        background:t.fraud_score>0.7?RED:t.fraud_score>0.4?AMBER:GREEN}}/>
                    </div>
                    <span style={{fontFamily:"monospace",fontSize:11,color:t.fraud_score>0.7?RED:t.fraud_score>0.4?AMBER:GREEN}}>
                      {(t.fraud_score*100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td style={{padding:"10px 12px",color:TEXT_DIM,fontSize:10}}>{t.timestamp.slice(0,16).replace("T"," ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Risk Profiles ─────────────────────────────────────────────────────────────
function RiskTab(){
  const [selected,setSelected]=useState(null);
  const radar=selected?[
    {metric:"Risk Score",value:selected.risk_score*100},
    {metric:"Velocity",value:selected.velocity_score*100},
    {metric:"Fraud Rate",value:selected.fraud_rate*100},
    {metric:"Credit Risk",value:((850-selected.credit_score)/550)*100},
    {metric:"Behavior",value:selected.risk_score*80},
  ]:[];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:20}}>
        <div style={{background:BG_CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:20}}>
          <SectionHeader title="User Risk Profiles" sub="Click a user to inspect their radar"/>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${BORDER}`}}>
                {["User","Tier","Risk Score","Credit","Velocity","Fraud Rate"].map(h=>(
                  <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10,color:TEXT_DIM,
                    letterSpacing:"0.08em",fontWeight:600,textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_RISK.map(p=>(
                <tr key={p.user_id} onClick={()=>setSelected(selected?.user_id===p.user_id?null:p)}
                  style={{borderBottom:`1px solid ${BORDER}22`,cursor:"pointer",
                    background:selected?.user_id===p.user_id?`${AMBER}0a`:"transparent"}}
                  onMouseEnter={e=>{if(selected?.user_id!==p.user_id)e.currentTarget.style.background=BG_PANEL;}}
                  onMouseLeave={e=>{if(selected?.user_id!==p.user_id)e.currentTarget.style.background="transparent";}}>
                  <td style={{padding:"10px 10px",color:TEXT_BRIGHT,fontWeight:600}}>{p.name}</td>
                  <td style={{padding:"10px 10px"}}><Badge label={p.tier} color={TIER_COL[p.tier]}/></td>
                  <td style={{padding:"10px 10px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:45,height:4,background:BORDER,borderRadius:2,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${p.risk_score*100}%`,background:TIER_COL[p.tier]}}/>
                      </div>
                      <span style={{fontFamily:"monospace",fontSize:11,color:TIER_COL[p.tier]}}>{(p.risk_score*100).toFixed(0)}</span>
                    </div>
                  </td>
                  <td style={{padding:"10px 10px",fontFamily:"monospace",fontSize:11,
                    color:p.credit_score<500?RED:p.credit_score<650?AMBER:GREEN}}>{p.credit_score}</td>
                  <td style={{padding:"10px 10px",fontFamily:"monospace",fontSize:11,color:TEXT_MID}}>{(p.velocity_score*100).toFixed(0)}%</td>
                  <td style={{padding:"10px 10px",fontFamily:"monospace",fontSize:11,
                    color:p.fraud_rate>0.1?RED:TEXT_MID}}>{(p.fraud_rate*100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{background:BG_CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:20}}>
          <SectionHeader title="Risk Radar" sub={selected?`${selected.name}`:"Select a user →"}/>
          {selected?(
            <>
              <div style={{textAlign:"center",marginBottom:8}}>
                <div style={{fontSize:22,fontWeight:800,color:TIER_COL[selected.tier],fontFamily:"monospace"}}>
                  {(selected.risk_score*100).toFixed(1)}
                </div>
                <div style={{fontSize:10,color:TEXT_DIM}}>Composite Risk Score</div>
                <Badge label={selected.tier} color={TIER_COL[selected.tier]}/>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radar} cx="50%" cy="50%" outerRadius={75}>
                  <PolarGrid stroke={BORDER}/>
                  <PolarAngleAxis dataKey="metric" tick={{fontSize:9,fill:TEXT_DIM}}/>
                  <PolarRadiusAxis angle={90} domain={[0,100]} tick={false} axisLine={false}/>
                  <Radar name="Risk" dataKey="value" stroke={TIER_COL[selected.tier]}
                    fill={TIER_COL[selected.tier]} fillOpacity={0.2} strokeWidth={2}/>
                </RadarChart>
              </ResponsiveContainer>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
                {[["Credit",selected.credit_score,selected.credit_score>700?GREEN:RED],
                  ["Velocity",`${(selected.velocity_score*100).toFixed(0)}%`,selected.velocity_score>0.6?RED:GREEN],
                  ["Fraud%",`${(selected.fraud_rate*100).toFixed(1)}%`,selected.fraud_rate>0.1?RED:GREEN],
                  ["Risk",`${(selected.risk_score*100).toFixed(0)}`,TIER_COL[selected.tier]]
                ].map(([l,v,c])=>(
                  <div key={l} style={{background:BG_PANEL,border:`1px solid ${BORDER}`,borderRadius:4,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:TEXT_DIM,textTransform:"uppercase",letterSpacing:"0.08em"}}>{l}</div>
                    <div style={{fontSize:16,fontWeight:800,color:c,fontFamily:"monospace",marginTop:2}}>{v}</div>
                  </div>
                ))}
              </div>
            </>
          ):(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
              color:TEXT_DIM,fontSize:12,height:300}}>← Click a user to inspect</div>
          )}
        </div>
      </div>
      <div style={{background:BG_CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:20}}>
        <SectionHeader title="Risk Tier Distribution" sub="Portfolio exposure overview"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
          {[{tier:"CRITICAL",count:1,desc:"Immediate action"},{tier:"HIGH",count:2,desc:"Enhanced monitoring"},
            {tier:"MEDIUM",count:2,desc:"Standard oversight"},{tier:"LOW",count:3,desc:"Normal behavior"}].map(t=>(
            <div key={t.tier} style={{background:BG_PANEL,border:`1px solid ${TIER_COL[t.tier]}30`,
              borderTop:`2px solid ${TIER_COL[t.tier]}`,borderRadius:5,padding:"14px 16px",textAlign:"center"}}>
              <div style={{fontSize:28,fontWeight:900,color:TIER_COL[t.tier],fontFamily:"monospace"}}>{t.count}</div>
              <div style={{fontSize:11,fontWeight:700,color:TIER_COL[t.tier],letterSpacing:"0.1em",marginTop:2}}>{t.tier}</div>
              <div style={{fontSize:10,color:TEXT_DIM,marginTop:4}}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Market Intel ──────────────────────────────────────────────────────────────
function MarketTab(){
  const [sel,setSel]=useState("BTC-USD");
  const base=MOCK_MARKET.find(m=>m.symbol===sel)?.price||100;
  const hist=Array.from({length:30},(_,i)=>({i,price:+(base*(0.9+Math.random()*0.2)).toFixed(2)}));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div>
        <SectionHeader title="Market Overview" sub="AI sentiment + trading signals"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {MOCK_MARKET.map(a=>(
            <div key={a.symbol} onClick={()=>setSel(a.symbol)} style={{
              background:sel===a.symbol?`${AMBER}0d`:BG_CARD,
              border:`1px solid ${sel===a.symbol?AMBER+"50":BORDER}`,
              borderRadius:6,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:12,fontWeight:800,color:TEXT_BRIGHT}}>{a.symbol}</span>
                <Badge label={a.signal} color={SIG_COL[a.signal]}/>
              </div>
              <div style={{fontSize:18,fontWeight:800,fontFamily:"monospace",color:TEXT_BRIGHT}}>
                ${a.price.toLocaleString()}
              </div>
              <div style={{fontSize:11,color:a.change_pct>=0?GREEN:RED,fontFamily:"monospace",marginTop:2}}>
                {a.change_pct>=0?"▲":"▼"} {Math.abs(a.change_pct)}%
              </div>
              <div style={{marginTop:8}}>
                <div style={{fontSize:9,color:TEXT_DIM,marginBottom:3}}>SENTIMENT</div>
                <div style={{height:3,background:BORDER,borderRadius:2,overflow:"hidden",position:"relative"}}>
                  <div style={{position:"absolute",top:0,height:"100%",
                    left:a.sentiment<0?`${50+a.sentiment*50}%`:"50%",
                    width:`${Math.abs(a.sentiment)*50}%`,
                    background:a.sentiment>0?GREEN:RED,borderRadius:2}}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:BG_CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:20}}>
        <SectionHeader title={`${sel} — Price History`} sub="30-point simulated price feed"/>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={hist} margin={{top:5,right:10,left:-10,bottom:0}}>
            <defs>
              <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={AMBER} stopOpacity={0.3}/><stop offset="95%" stopColor={AMBER} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
            <XAxis dataKey="i" stroke={TEXT_DIM} tick={false}/>
            <YAxis stroke={TEXT_DIM} tick={{fontSize:10}} tickFormatter={v=>`$${v.toLocaleString()}`}/>
            <Tooltip contentStyle={{background:BG_PANEL,border:`1px solid ${BORDER}`,fontSize:12}} labelStyle={{color:AMBER}} labelFormatter={()=>sel}/>
            <Area type="monotone" dataKey="price" stroke={AMBER} fill="url(#pg)" strokeWidth={2} name="Price"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Live Checker ──────────────────────────────────────────────────────────────
function LiveCheckerTab(){
  const [form,setForm]=useState({amount:"",merchant:"Amazon",category:"Retail",location:"New York, US",channel:"web"});
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);

  const MERCHANTS=["Amazon","Unknown Vendor","CryptoExchange_XYZ","FastCash ATM","Starbucks","Apple Store","Netflix","IntlTransfer99"];
  const CATEGORIES=["Retail","Crypto","Cash Withdrawal","Wire Transfer","Food & Dining","Entertainment","Subscription"];
  const LOCATIONS=["New York, US","London, UK","Mumbai, IN","Unknown","Lagos, NG","Tokyo, JP"];
  const CHANNELS=["web","mobile_app","pos_terminal","atm","api_transfer"];

  const handleCheck=async()=>{
    if(!form.amount||isNaN(form.amount))return;
    setLoading(true);setResult(null);
    await new Promise(r=>setTimeout(r,800));
    let score=0.05;
    if(["Unknown Vendor","CryptoExchange_XYZ","FastCash ATM","IntlTransfer99"].includes(form.merchant))score+=0.4;
    if(["Crypto","Cash Withdrawal","Wire Transfer"].includes(form.category))score+=0.2;
    if(form.location==="Unknown")score+=0.15;
    if(parseFloat(form.amount)>5000)score+=0.2;
    if(parseFloat(form.amount)>10000)score+=0.15;
    score=Math.min(score+Math.random()*0.1,0.99);
    const risk=score<0.3?"LOW":score<0.6?"MEDIUM":score<0.85?"HIGH":"CRITICAL";
    setResult({fraud_probability:+score.toFixed(4),is_fraud:score>0.5?1:0,risk_level:risk,
      top_factors:[{feature:"amount",importance:0.34},{feature:"merchant",importance:0.28},{feature:"category",importance:0.22}],
      model:"RandomForest_v2"});
    setLoading(false);
  };

  const inp={background:BG_PANEL,border:`1px solid ${BORDER}`,borderRadius:4,padding:"9px 12px",
    color:TEXT_BRIGHT,fontSize:12,width:"100%",outline:"none",fontFamily:"monospace",boxSizing:"border-box"};

  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,alignItems:"start"}}>
      <div style={{background:BG_CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:24}}>
        <SectionHeader title="Live Fraud Checker" sub="Score any transaction with the ML model"/>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <label style={{fontSize:10,color:TEXT_DIM,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:5}}>Amount (USD)</label>
            <input type="number" placeholder="e.g. 8500" value={form.amount}
              onChange={e=>setForm(p=>({...p,amount:e.target.value}))} style={inp}/>
          </div>
          {[{label:"Merchant",key:"merchant",opts:MERCHANTS},
            {label:"Category",key:"category",opts:CATEGORIES},
            {label:"Location",key:"location",opts:LOCATIONS},
            {label:"Channel",key:"channel",opts:CHANNELS}].map(f=>(
            <div key={f.key}>
              <label style={{fontSize:10,color:TEXT_DIM,textTransform:"uppercase",letterSpacing:"0.1em",display:"block",marginBottom:5}}>{f.label}</label>
              <select value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} style={{...inp,cursor:"pointer"}}>
                {f.opts.map(o=><option key={o} value={o} style={{background:BG_PANEL}}>{o}</option>)}
              </select>
            </div>
          ))}
          <button onClick={handleCheck} disabled={loading} style={{
            padding:"12px 20px",borderRadius:4,fontWeight:800,fontSize:12,letterSpacing:"0.1em",
            cursor:loading?"wait":"pointer",background:loading?`${AMBER}30`:`${AMBER}20`,
            border:`1px solid ${AMBER}60`,color:AMBER,textTransform:"uppercase",transition:"all 0.2s",marginTop:4}}>
            {loading?"⚡ Scoring...":"⚡ Score Transaction"}
          </button>
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {result?(
          <>
            <div style={{background:BG_CARD,border:`2px solid ${SEV_COL[result.risk_level]}`,borderRadius:6,
              padding:24,textAlign:"center",boxShadow:`0 0 30px ${SEV_COL[result.risk_level]}20`}}>
              <div style={{fontSize:10,color:TEXT_DIM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:8}}>Fraud Probability</div>
              <div style={{fontSize:52,fontWeight:900,fontFamily:"monospace",color:SEV_COL[result.risk_level],lineHeight:1}}>
                {(result.fraud_probability*100).toFixed(1)}%
              </div>
              <div style={{marginTop:12}}><Badge label={result.risk_level} color={SEV_COL[result.risk_level]}/></div>
              <div style={{marginTop:14,fontSize:13,fontWeight:700,color:result.is_fraud?RED:GREEN}}>
                {result.is_fraud?"🚨 FRAUD DETECTED — Block Transaction":"✅ LEGITIMATE — Approve Transaction"}
              </div>
            </div>
            <div style={{background:BG_CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:20}}>
              <div style={{fontSize:10,color:TEXT_DIM,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>Risk Gauge</div>
              <div style={{height:10,background:BORDER,borderRadius:5,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${result.fraud_probability*100}%`,
                  background:`linear-gradient(90deg,${GREEN},${AMBER},${RED})`,
                  borderRadius:5,transition:"width 0.6s ease"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:TEXT_DIM,marginTop:4}}>
                <span style={{color:GREEN}}>LOW</span><span style={{color:AMBER}}>MEDIUM</span><span style={{color:RED}}>CRITICAL</span>
              </div>
            </div>
            <div style={{background:BG_CARD,border:`1px solid ${BORDER}`,borderRadius:6,padding:20}}>
              <SectionHeader title="Top Risk Factors" sub="Feature importances"/>
              {result.top_factors.map((f,i)=>(
                <div key={i} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
                    <span style={{color:TEXT_MID,textTransform:"uppercase",letterSpacing:"0.06em"}}>{f.feature}</span>
                    <span style={{color:AMBER,fontFamily:"monospace"}}>{(f.importance*100).toFixed(0)}%</span>
                  </div>
                  <div style={{height:5,background:BORDER,borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${f.importance*100}%`,background:AMBER,borderRadius:3}}/>
                  </div>
                </div>
              ))}
              <div style={{fontSize:10,color:TEXT_DIM,marginTop:8,fontFamily:"monospace"}}>Model: {result.model}</div>
            </div>
          </>
        ):(
          <div style={{background:BG_CARD,border:`1px dashed ${BORDER}`,borderRadius:6,
            padding:60,textAlign:"center",color:TEXT_DIM}}>
            <div style={{fontSize:36,marginBottom:12,opacity:0.3}}>⚡</div>
            <div style={{fontSize:13}}>Enter transaction details and click</div>
            <div style={{fontSize:12,color:AMBER,marginTop:4}}>Score Transaction</div>
            <div style={{fontSize:11,marginTop:16,color:TEXT_DIM,lineHeight:1.6}}>
              ML model will predict fraud probability,<br/>identify risk factors, and recommend action.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App(){
  const [activeTab,setActiveTab]=useState("overview");
  const [time,setTime]=useState(new Date());

  useEffect(()=>{
    const t=setInterval(()=>setTime(new Date()),1000);
    return()=>clearInterval(t);
  },[]);

  const tabs={overview:<OverviewTab/>,fraud:<FraudTab/>,transactions:<TransactionsTab/>,
               risk:<RiskTab/>,market:<MarketTab/>,checker:<LiveCheckerTab/>};

  return(
    <div style={{display:"flex",minHeight:"100vh",background:BG_DEEP,color:TEXT_BRIGHT,
      fontFamily:"'IBM Plex Mono','JetBrains Mono','Courier New',monospace"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:${BG_DEEP};}
        ::-webkit-scrollbar-thumb{background:${BORDER};border-radius:3px;}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
        select option{background:#111520;}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
      `}</style>

      <Sidebar active={activeTab} setActive={setActiveTab}/>

      <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <header style={{padding:"14px 28px",borderBottom:`1px solid ${BORDER}`,
          display:"flex",alignItems:"center",justifyContent:"space-between",
          background:BG_CARD,flexShrink:0}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:TEXT_BRIGHT,textTransform:"uppercase",letterSpacing:"0.1em"}}>
              {NAV.find(n=>n.id===activeTab)?.icon} {NAV.find(n=>n.id===activeTab)?.label}
            </div>
            <div style={{fontSize:10,color:TEXT_DIM,marginTop:2}}>FinSight AI · Finance & FinTech Intelligence Platform</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:20}}>
            <div style={{fontSize:10,color:TEXT_DIM,textAlign:"right"}}>
              <div style={{color:AMBER,fontFamily:"monospace"}}>{time.toLocaleTimeString()}</div>
              <div>{time.toLocaleDateString()}</div>
            </div>
            <div style={{padding:"6px 12px",background:`${RED}14`,border:`1px solid ${RED}40`,
              borderRadius:4,fontSize:10,color:RED,fontWeight:700,letterSpacing:"0.1em",
              display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:RED,animation:"pulse 1.5s infinite"}}/>
              {MOCK_KPIS.open_alerts} OPEN ALERTS
            </div>
          </div>
        </header>
        <div style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>
          {tabs[activeTab]}
        </div>
      </main>
    </div>
  );
}
