import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { Line, Doughnut } from 'react-chartjs-2';
import { 
  LayoutDashboard, Settings, Flower2, Moon, 
  Trash2, ChevronLeft, ChevronRight, LogOut, 
  TrendingUp, Layers, BookOpen, Heart, Activity,
  RefreshCw, Check, Calendar 
} from 'lucide-react';
import { format, getDaysInMonth, addMonths, subMonths } from 'date-fns';
import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);

// --- FIREBASE CONFIG ---
const firebaseConfig = {   
  apiKey: "AIzaSyAXzx6oJY4cRA1_5lt6Yq6-5a8sH-lM5Ms",
  authDomain: "habit-tracker-7c06b.firebaseapp.com",
  projectId: "habit-tracker-7c06b",
  storageBucket: "habit-tracker-7c06b.firebasestorage.app",
  messagingSenderId: "951825950183",
  appId: "1:951825950183:web:6d684ba65c81f985d0c942",
  measurementId: "G-CED6532FCZ" 
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- THEME ENGINE ---
const themes = {
  midnight: {
    name: 'Midnight Pro', bg: '#080A0F', surface: '#11151F', border: '#1E2533', 
    text: '#F1F5F9', textMuted: '#64748B', accent: '#3B82F6',
    headerBg: '#1E2533', headerText: '#F1F5F9',
    study: '#A855F7', self: '#F97316', health: '#10B981', danger: '#EF4444'
  },
  sakura: {
    name: 'Sakura Bloom', bg: '#FFF5F7', surface: '#FFFFFF', border: '#FFE4E6', 
    text: '#471825', textMuted: '#A27E88', accent: '#F472B6',
    headerBg: '#BE185D', headerText: '#FFFFFF',
    study: '#D946EF', self: '#FB923C', health: '#4ADE80', danger: '#E11D48'
  }
};

export default function UltimateHabitTracker() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('midnight');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [tasks, setTasks] = useState({ daily: [], weekly: [], monthly: [], yearly: [] });
  const [checks, setChecks] = useState({});
  const [goals, setGoals] = useState({}); 

  const t = themes[theme];
  const monthKey = format(currentDate, 'yyyy-MM');
  const daysInMonth = getDaysInMonth(currentDate);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(doc(db, "users", u.uid), (doc) => {
          if (doc.exists()) {
            const d = doc.data();
            setTasks(d.tasks || { daily: [], weekly: [], monthly: [], yearly: [] });
            setChecks(d.checks || {});
            setGoals(d.goals || {}); 
          }
        });
      }
    });
  }, []);

  const persist = (data) => user && setDoc(doc(db, "users", user.uid), data, { merge: true });

  const toggleCheck = (id, subKey) => {
    const key = `${id}-${subKey}`;
    const updated = { ...checks, [key]: !checks[key] };
    setChecks(updated);
    persist({ checks: updated });
  };

  const addTask = (type) => {
    const name = prompt(`Enter ${type} task name:`);
    const category = prompt("Category? (Study, Self, Health)");
    if (!name || !category) return;
    const newList = [...tasks[type], { id: Date.now(), name, category }];
    const updatedTasks = { ...tasks, [type]: newList };
    setTasks(updatedTasks);
    persist({ tasks: updatedTasks });
  };

  const deleteTask = (type, id) => {
    const newList = tasks[type].filter(t => t.id !== id);
    const updatedTasks = { ...tasks, [type]: newList };
    setTasks(updatedTasks);
    persist({ tasks: updatedTasks });
  };

  const handleGoalChange = (habitId, value) => {
    const key = `${habitId}-${monthKey}`;
    const updatedGoals = { ...goals, [key]: parseInt(value) || 0 };
    setGoals(updatedGoals);
    persist({ goals: updatedGoals });
  };

  const wipeCheckboxes = async () => {
    if (window.confirm("⚠️ Are you sure? This will wipe ALL checkmarks.")) {
      setChecks({});
      persist({ checks: {} });
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const analytics = useMemo(() => {
    const sidebarStats = { Study: { done: 0, potential: 0 }, Self: { done: 0, potential: 0 }, Health: { done: 0, potential: 0 } };
    const goalStats = { Study: { done: 0, goalSum: 0 }, Self: { done: 0, goalSum: 0 }, Health: { done: 0, goalSum: 0 } };

    const dailyLine = Array.from({ length: daysInMonth }, (_, i) => {
      let dCount = 0;
      tasks.daily.forEach(h => {
        if(checks[`${h.id}-${monthKey}-${i+1}`]) {
            dCount++;
            if(sidebarStats[h.category]) sidebarStats[h.category].done++;
            if(goalStats[h.category]) goalStats[h.category].done++;
        }
      });
      return tasks.daily.length ? (dCount / tasks.daily.length) * 100 : 0;
    });

    tasks.daily.forEach(h => {
        if(sidebarStats[h.category]) sidebarStats[h.category].potential += daysInMonth;
        if(goalStats[h.category]) {
            const customGoal = goals[`${h.id}-${monthKey}`] ?? daysInMonth;
            goalStats[h.category].goalSum += customGoal;
        }
    });

    return { dailyLine, sidebarStats, goalStats, totalDone: Object.values(checks).filter(v => v).length };
  }, [tasks, checks, goals, monthKey, daysInMonth]);

  if (!user) return <LoginScreen t={themes.midnight} />;

  return (
    <div style={{ backgroundColor: t.bg, color: t.text, minHeight: '100vh', display: 'flex', fontFamily: 'Outfit, sans-serif' }}>
      
      <style>{`
        @keyframes tickIn {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .tick-icon { animation: tickIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .premium-shadow { box-shadow: 0 20px 50px rgba(0,0,0,0.15); }
      `}</style>

      <nav style={{ width: '85px', backgroundColor: t.surface, borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', py: '40px', position: 'fixed', height: '100vh', zIndex: 100 }}>
         <div style={{ margin: '30px 0', color: t.accent }}><TrendingUp size={32} strokeWidth={3}/></div>
         <NavIcon active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} icon={<LayoutDashboard/>} label="Daily" t={t} />
         <NavIcon active={activeTab==='tracker'} onClick={()=>setActiveTab('tracker')} icon={<Layers/>} label="Timeline" t={t} />
         <NavIcon active={activeTab==='planner'} onClick={()=>setActiveTab('planner')} icon={<Settings/>} label="Manage" t={t} />
         
         <div style={{ marginTop: 'auto', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <button onClick={() => setTheme(theme==='midnight'?'sakura':'midnight')} style={iconBtn(t)}>
                {theme === 'midnight' ? <Flower2 size={24}/> : <Moon size={24}/>}
            </button>
            <button onClick={() => signOut(auth)} style={iconBtn(t)}><LogOut size={24}/></button>
         </div>
      </nav>

      <main style={{ marginLeft: '85px', flex: 1, padding: '40px' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div>
                <h1 style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-1.5px', margin: 0 }}>
                    {format(currentDate, 'MMMM yyyy').toUpperCase()}
                </h1>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                    <button onClick={()=>setCurrentDate(subMonths(currentDate, 1))} style={arrowBtn(t)}><ChevronLeft size={18}/></button>
                    <button onClick={goToToday} style={{ ...arrowBtn(t), fontSize: '11px', fontWeight: '900', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={14}/> TODAY
                    </button>
                    <button onClick={()=>setCurrentDate(addMonths(currentDate, 1))} style={arrowBtn(t)}><ChevronRight size={18}/></button>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <button 
                  onClick={wipeCheckboxes} 
                  style={{ 
                    background: 'transparent', border: `1px solid ${t.danger}`, color: t.danger, 
                    borderRadius: '12px', padding: '12px 18px', fontSize: '11px', fontWeight: '900', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <RefreshCw size={14}/> WIPE DATA
                </button>

                <BigGauge label="Efficiency" perc={Math.round((analytics.totalDone / (tasks.daily.length * daysInMonth || 1)) * 100)} color={t.accent} t={t} />
                <BigGauge label="Consistency" perc={78} color={t.health} t={t} />
            </div>
        </header>

        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
            <div className="premium-shadow" style={{ background: t.surface, borderRadius: '24px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: t.headerBg, color: t.headerText }}>
                            <tr>
                                <th style={{ padding: '20px', textAlign: 'left', minWidth: '180px' }}>HABIT TRACKER</th>
                                {Array.from({length: daysInMonth}).map((_,i) => <th key={i} style={{ padding: '8px', fontSize: '12px' }}>{i+1}</th>)}
                                <th style={{ padding: '10px' }}>SUM</th>
                                <th style={{ padding: '10px' }}>GOAL</th>
                                <th style={{ padding: '10px' }}>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.daily.map(h => {
                                const sum = Array.from({length: daysInMonth}).filter((_,i) => checks[`${h.id}-${monthKey}-${i+1}`]).length;
                                const currentGoal = goals[`${h.id}-${monthKey}`] ?? daysInMonth;
                                
                                return (
                                <tr key={h.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                    <td style={{ padding: '15px 20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '4px', height: '16px', borderRadius: '2px', backgroundColor: t[h.category.toLowerCase()] || t.accent }}></div>
                                        {h.name}
                                    </td>
                                    {Array.from({length: daysInMonth}).map((_,i) => {
                                        const isChecked = checks[`${h.id}-${monthKey}-${i+1}`];
                                        const habitColor = t[h.category.toLowerCase()] || t.accent;
                                        return (
                                        <td key={i} style={{ textAlign: 'center' }}>
                                            <div 
                                              onClick={() => toggleCheck(h.id, `${monthKey}-${i+1}`)} 
                                              style={{ 
                                                width: '18px', height: '18px', borderRadius: '6px', margin: 'auto', cursor: 'pointer',
                                                background: isChecked ? habitColor : 'transparent', 
                                                border: `2.5px solid ${isChecked ? habitColor : t.border}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s',
                                                boxShadow: isChecked ? `0 0 10px ${habitColor}66` : 'none'
                                              }}
                                            >
                                              {isChecked && <Check size={12} color="white" strokeWidth={4} className="tick-icon" />}
                                            </div>
                                        </td>
                                    )})}
                                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{sum}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input 
                                            type="number" 
                                            value={currentGoal}
                                            onChange={(e) => handleGoalChange(h.id, e.target.value)}
                                            style={{ 
                                                width: '40px', background: 'transparent', border: 'none', 
                                                color: t.text, textAlign: 'center', fontSize: '12px', fontWeight: 'bold',
                                                outline: 'none', padding: '2px'
                                            }}
                                        />
                                    </td>
                                    <td style={{ textAlign: 'center', color: t.accent, fontWeight: 'bold' }}>
                                        {Math.round((sum / currentGoal) * 100)}%
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <CategoryStat label="Study & Skills" icon={<BookOpen size={16} />} stats={analytics.sidebarStats.Study} color={t.study} t={t} />
                <CategoryStat label="Self & Spirit" icon={<Heart size={16} />} stats={analytics.sidebarStats.Self} color={t.self} t={t} />
                <CategoryStat label="Health & Peace" icon={<Activity size={16} />} stats={analytics.sidebarStats.Health} color={t.health} t={t} />
            </aside>

            {/* Bottom Section: Trend Graph (Shortened) + Gauge Charts */}
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div className="premium-shadow" style={{ background: t.surface, padding: '25px 30px', borderRadius: '24px', border: `1px solid ${t.border}` }}>
                    <h3 style={{ marginBottom: '15px' }}>Daily Consistency Trend</h3>
                    {/* Height shortened to 160px as requested */}
                    <div style={{ height: '160px' }}><Line data={lineData(analytics.dailyLine, t)} options={lineOptions(t)} /></div>
                </div>

                <div className="premium-shadow" style={{ background: t.surface, padding: '30px', borderRadius: '24px', border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <GoalDoughnut label="Study" stats={analytics.goalStats.Study} color={t.study} t={t} />
                    <GoalDoughnut label="Self" stats={analytics.goalStats.Self} color={t.self} t={t} />
                    <GoalDoughnut label="Health" stats={analytics.goalStats.Health} color={t.health} t={t} />
                </div>
            </div>
          </div>
        )}

        {activeTab === 'tracker' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <TimelineSection title="Weekly Tasks" data={tasks.weekly} subKey={`${monthKey}-week`} count={5} t={t} toggle={toggleCheck} checks={checks} />
            <TimelineSection title="Monthly Focus" data={tasks.monthly} subKey={`${format(currentDate, 'yyyy')}-month`} count={12} t={t} toggle={toggleCheck} checks={checks} />
            <TimelineSection title="Yearly Milestones" data={tasks.yearly} subKey="year" count={1} t={t} toggle={toggleCheck} checks={checks} />
          </div>
        )}

        {activeTab === 'planner' && (
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
              <ManageCard type="daily" data={tasks.daily} add={addTask} del={deleteTask} t={t} />
              <ManageCard type="weekly" data={tasks.weekly} add={addTask} del={deleteTask} t={t} />
              <ManageCard type="monthly" data={tasks.monthly} add={addTask} del={deleteTask} t={t} />
              <ManageCard type="yearly" data={tasks.yearly} add={addTask} del={deleteTask} t={t} />
           </div>
        )}
      </main>
    </div>
  );
}

const NavIcon = ({ active, onClick, icon, label, t }) => (
  <div onClick={onClick} style={{ width: '50px', textAlign: 'center', cursor: 'pointer', marginBottom: '25px', transition: '0.3s' }}>
    <div style={{ width: '50px', height: '50px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: active ? t.accent : 'transparent', color: active ? '#fff' : t.textMuted, boxShadow: active ? `0 10px 20px ${t.accent}44` : 'none', marginBottom: '5px' }}>
      {icon}
    </div>
    <span style={{ fontSize: '10px', fontWeight: 'bold', color: active ? t.text : t.textMuted }}>{label}</span>
  </div>
);

const BigGauge = ({ label, perc, color, t }) => (
    <div className="premium-shadow" style={{ background: t.surface, padding: '20px', borderRadius: '24px', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '15px', minWidth: '180px' }}>
        <div style={{ width: '65px', height: '65px', position: 'relative' }}>
            <Doughnut data={{ datasets: [{ data: [perc, 100-perc], backgroundColor: [color, 'rgba(0,0,0,0.1)'], borderWidth: 0 }] }} options={{ cutout: '75%', plugins: { tooltip: { enabled: false } } }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '900' }}>{perc}%</div>
        </div>
        <div style={{ fontSize: '12px', fontWeight: '800', opacity: 0.7 }}>{label}</div>
    </div>
);

const TimelineSection = ({ title, data, subKey, count, t, toggle, checks }) => (
  <div className="premium-shadow" style={{ background: t.surface, padding: '30px', borderRadius: '24px', border: `1px solid ${t.border}` }}>
    <h3 style={{ marginBottom: '25px' }}>{title}</h3>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: t.headerBg, color: t.headerText }}>
            <tr>
                <th style={{ padding: '15px', textAlign: 'left' }}>TASK NAME</th>
                {Array.from({length: count}).map((_,i) => <th key={i} style={{ padding: '10px' }}>{count > 1 ? i+1 : 'Done'}</th>)}
            </tr>
        </thead>
        <tbody>
            {data.map(item => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: '15px', fontWeight: '600' }}>{item.name}</td>
                    {Array.from({length: count}).map((_,i) => {
                        const isChecked = checks[`${item.id}-${subKey}-${i+1}`];
                        return (
                        <td key={i} style={{ textAlign: 'center' }}>
                            <div 
                              onClick={() => toggle(item.id, `${subKey}-${i+1}`)} 
                              style={{
                                width: '18px', height: '18px', borderRadius: '6px', margin: 'auto', cursor: 'pointer',
                                background: isChecked ? t.accent : 'transparent', border: `2.5px solid ${isChecked ? t.accent : t.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              {isChecked && <Check size={12} color="white" strokeWidth={4} className="tick-icon" />}
                            </div>
                        </td>
                    )})}
                </tr>
            ))}
        </tbody>
    </table>
  </div>
);

const ManageCard = ({ type, data, add, del, t }) => (
    <div className="premium-shadow" style={{ background: t.surface, padding: '25px', borderRadius: '24px', border: `1px solid ${t.border}` }}>
        <h4 style={{ textTransform: 'capitalize', marginBottom: '20px' }}>{type} Manager</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: t.bg, borderRadius: '12px', fontSize: '13px' }}>
                    <span>{item.name}</span>
                    <button onClick={()=>del(type, item.id)} style={{ color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={16}/></button>
                </div>
            ))}
            <button onClick={()=>add(type)} style={{ width: '100%', padding: '12px', border: `1px dashed ${t.accent}`, borderRadius: '12px', color: t.accent, background: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>+ Add {type} Task</button>
        </div>
    </div>
);

const CategoryStat = ({ label, icon, stats, color, t }) => {
    const perc = stats.potential ? Math.round((stats.done / stats.potential) * 100) : 0;
    return (
        <div className="premium-shadow" style={{ background: t.surface, padding: '20px', borderRadius: '24px', border: `1px solid ${t.border}`, borderLeft: `6px solid ${color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                <span style={{ color: t.textMuted, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {icon} {label.toUpperCase()}
                </span>
                <span style={{ color }}>{perc}%</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900' }}>{stats.done} <span style={{ fontSize: '12px', color: t.textMuted }}>/ {stats.potential} units</span></div>
        </div>
    );
};

const GoalDoughnut = ({ label, stats, color, t }) => {
    const perc = stats.goalSum ? Math.round((stats.done / stats.goalSum) * 100) : 0;
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ width: '100px', height: '100px', position: 'relative', margin: '0 auto 10px' }}>
                <Doughnut 
                    data={{ datasets: [{ data: [perc, 100 - perc], backgroundColor: [color, 'rgba(0,0,0,0.1)'], borderWidth: 0 }] }} 
                    options={{ cutout: '80%', plugins: { tooltip: { enabled: false } } }} 
                />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '900' }}>{perc}%</div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: t.text }}>{label}</div>
            <div style={{ fontSize: '10px', color: t.textMuted }}>{stats.done}/{stats.goalSum} Goal</div>
        </div>
    );
};

const LoginScreen = ({ t }) => (
    <div style={{ background: t.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} style={{ padding: '15px 35px', background: t.accent, color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' }}>LOGIN TO DASHBOARD</button>
    </div>
);

const iconBtn = (t) => ({ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted });
const arrowBtn = (t) => ({ background: t.surface, border: `1px solid ${t.border}`, color: t.text, borderRadius: '8px', padding: '6px', cursor: 'pointer' });
const lineData = (data, t) => ({ labels: data.map((_,i)=>i+1), datasets: [{ data, borderColor: t.accent, backgroundColor: t.accent+'11', fill: true, tension: 0.4, pointRadius: 2 }] });
const lineOptions = (t) => ({ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { min: 0, max: 100, grid: { color: t.border }, ticks: { color: t.textMuted, fontSize: 10 } } } });