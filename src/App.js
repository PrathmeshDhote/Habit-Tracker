import React, { useState } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Check, Activity, Heart, BookOpen, Target } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

// --- STYLING CONSTANTS ---
const COLORS = {
  bg: '#0B0E14',
  surface: '#151921',
  border: '#2D343F',
  textMain: '#E2E8F0',
  textDim: '#94A3B8',
  study: '#A855F7', // Purple
  self: '#F97316',  // Orange
  health: '#10B981', // Green
  accent: '#3B82F6'  // Blue
};

const habits = [
  { id: 1, name: 'Workout', cat: 'Important', group: 'Health' },
  { id: 2, name: 'CET Study', cat: 'Important', group: 'Study' },
  { id: 3, name: 'College Studies', cat: 'Important', group: 'Study' },
  { id: 4, name: 'Railway Studies', cat: 'Important', group: 'Study' },
  { id: 5, name: 'Skill', cat: 'Important', group: 'Study' },
  { id: 6, name: 'Project', cat: 'Important', group: 'Study' },
  { id: 7, name: 'Temple', cat: 'Important', group: 'Self' },
  { id: 8, name: 'Garden', cat: 'Important', group: 'Self' },
  { id: 9, name: 'Listen and learn', cat: 'Important', group: 'Study' },
  { id: 10, name: 'Clean & Organize', cat: 'Additional', group: 'Self' },
  { id: 11, name: 'Call Family', cat: 'Additional', group: 'Self' },
  { id: 12, name: 'Shop only once', cat: 'Additional', group: 'Health' },
  { id: 13, name: 'No Junk food', cat: 'Additional', group: 'Health' },
  { id: 14, name: '6+ hrs Sleep', cat: 'Additional', group: 'Health' },
  { id: 15, name: '2+ L Water', cat: 'Additional', group: 'Health' },
];

const App = () => {
  const [data, setData] = useState({});
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const toggle = (id, day) => {
    const key = `${id}-${day}`;
    setData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Logic Helpers
  const getRowTotal = (id) => days.filter(d => data[`${id}-${d}`]).length;
  const getDayTotal = (day) => habits.filter(h => data[`${h.id}-${day}`]).length;
  
  const getGroupStats = (group) => {
    const groupHabits = habits.filter(h => h.group === group);
    const totalPossible = groupHabits.length * 31;
    const actual = groupHabits.reduce((acc, h) => acc + getRowTotal(h.id), 0);
    return { actual, totalPossible, perc: totalPossible ? Math.round((actual / totalPossible) * 100) : 0 };
  };

  // Chart Data Configurations
  const lineData = {
    labels: days,
    datasets: [{
      label: 'Daily Productivity %',
      data: days.map(d => (getDayTotal(d) / habits.length) * 100),
      borderColor: COLORS.accent,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 2,
    }]
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: '#1E293B' }, ticks: { color: COLORS.textDim, fontSize: 10 } },
      x: { grid: { display: false }, ticks: { color: COLORS.textDim, fontSize: 10 } }
    }
  };

  return (
    <div style={{ backgroundColor: COLORS.bg, color: COLORS.textMain, minHeight: '100vh', padding: '20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          APRIL <span style={{ color: COLORS.accent }}>2026</span>
          <span style={{ fontSize: '12px', color: COLORS.textDim, marginLeft: '15px', fontWeight: '400' }}>Habit Mastery Dashboard</span>
        </h1>
        <div style={{ display: 'flex', gap: '20px' }}>
             <StatBox label="Total Completed" value={Object.values(data).filter(v => v).length} color={COLORS.accent} />
             <StatBox label="Monthly Efficiency" value={`${Math.round((Object.values(data).filter(v => v).length / (habits.length * 31)) * 100)}%`} color={COLORS.health} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        
        {/* MAIN TRACKER TABLE */}
        <div style={{ backgroundColor: COLORS.surface, borderRadius: '12px', border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}`, backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: COLORS.textDim }}>HABIT TRACKER</th>
                {days.map(d => <th key={d} style={{ width: '22px', color: COLORS.textDim }}>{d}</th>)}
                <th style={{ padding: '10px', color: COLORS.accent }}>SUM</th>
                <th style={{ padding: '10px', color: COLORS.textDim }}>%</th>
              </tr>
            </thead>
            <tbody>
              {habits.map((h, i) => (
                <tr key={h.id} style={{ borderBottom: i === 8 ? `2px solid ${COLORS.border}` : `1px solid ${COLORS.border}`, transition: '0.2s' }}>
                  <td style={{ padding: '8px 12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '4px', height: '15px', borderRadius: '2px', backgroundColor: h.group === 'Study' ? COLORS.study : h.group === 'Health' ? COLORS.health : COLORS.self }}></div>
                    {h.name}
                  </td>
                  {days.map(d => (
                    <td key={d} style={{ textAlign: 'center' }}>
                      <CustomCheckbox 
                        checked={data[`${h.id}-${d}`]} 
                        onClick={() => toggle(h.id, d)} 
                        color={h.group === 'Study' ? COLORS.study : h.group === 'Health' ? COLORS.health : COLORS.self}
                      />
                    </td>
                  ))}
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: COLORS.textMain }}>{getRowTotal(h.id)}</td>
                  <td style={{ textAlign: 'center', color: COLORS.textDim }}>{Math.round((getRowTotal(h.id)/31)*100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RIGHT SIDEBAR STATS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <CategoryCard title="Study & Skills" stats={getGroupStats('Study')} color={COLORS.study} icon={<BookOpen size={16}/>} />
          <CategoryCard title="Self & Spirit" stats={getGroupStats('Self')} color={COLORS.self} icon={<Heart size={16}/>} />
          <CategoryCard title="Health & Peace" stats={getGroupStats('Health')} color={COLORS.health} icon={<Activity size={16}/>} />
          
          {/* MINI DOUGHNUTS */}
          <div style={{ backgroundColor: COLORS.surface, padding: '20px', borderRadius: '12px', border: `1px solid ${COLORS.border}`, flex: 1 }}>
              <h3 style={{ fontSize: '12px', color: COLORS.textDim, marginBottom: '15px', textAlign: 'center' }}>CATEGORY PROGRESS</h3>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <MiniChart perc={getGroupStats('Study').perc} color={COLORS.study} label="Study" />
                <MiniChart perc={getGroupStats('Self').perc} color={COLORS.self} label="Self" />
                <MiniChart perc={getGroupStats('Health').perc} color={COLORS.health} label="Health" />
              </div>
          </div>
        </div>
      </div>

      {/* SUMMARY CHART SECTION */}
      <div style={{ marginTop: '20px', backgroundColor: COLORS.surface, borderRadius: '12px', border: `1px solid ${COLORS.border}`, padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Target size={18} color={COLORS.accent} />
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Daily Consistency Trend</span>
        </div>
        <div style={{ height: '180px' }}>
          <Line data={lineData} options={commonOptions} />
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const CustomCheckbox = ({ checked, onClick, color }) => (
  <div 
    onClick={onClick}
    style={{
      width: '14px', height: '14px', borderRadius: '3px', margin: 'auto', cursor: 'pointer',
      border: `1px solid ${checked ? color : '#334155'}`,
      backgroundColor: checked ? color : 'transparent',
      boxShadow: checked ? `0 0 8px ${color}66` : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s all'
    }}
  >
    {checked && <Check size={10} color="white" strokeWidth={4} />}
  </div>
);

const StatBox = ({ label, value, color }) => (
  <div style={{ textAlign: 'right' }}>
    <div style={{ fontSize: '10px', color: COLORS.textDim, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontSize: '18px', fontWeight: 'bold', color: color }}>{value}</div>
  </div>
);

const CategoryCard = ({ title, stats, color, icon }) => (
  <div style={{ 
    backgroundColor: COLORS.surface, padding: '15px', borderRadius: '12px', border: `1px solid ${COLORS.border}`,
    borderLeft: `4px solid ${color}` 
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ color: COLORS.textDim, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>{icon} {title}</span>
        <span style={{ fontWeight: 'bold', color: color }}>{stats.perc}%</span>
    </div>
    <div style={{ height: '6px', backgroundColor: '#1E293B', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${stats.perc}%`, height: '100%', backgroundColor: color, boxShadow: `0 0 10px ${color}` }}></div>
    </div>
    <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 'bold' }}>
      {stats.actual} <span style={{ color: COLORS.textDim, fontWeight: 'normal', fontSize: '10px' }}>/ {stats.totalPossible} units</span>
    </div>
  </div>
);

const MiniChart = ({ perc, color, label }) => {
    const data = {
        datasets: [{ data: [perc, 100 - perc], backgroundColor: [color, '#1E293B'], borderWidth: 0 }]
    };
    return (
        <div style={{ textAlign: 'center', width: '60px' }}>
            <div style={{ height: '60px', width: '60px', position: 'relative', marginBottom: '5px' }}>
                <Doughnut data={data} options={{ cutout: '80%', plugins: { tooltip: { enabled: false } } }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '10px', fontWeight: 'bold' }}>{perc}%</div>
            </div>
            <div style={{ fontSize: '10px', color: COLORS.textDim }}>{label}</div>
        </div>
    );
}

export default App;