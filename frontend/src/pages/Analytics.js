import React, { useState, useEffect, useCallback } from 'react';
import { expenseAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler } from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler);

const COLORS = ['#00d4aa','#7c6ff7','#f59e0b','#f43f5e','#10b981','#3b82f6','#ec4899','#8b5cf6','#06b6d4','#84cc16'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmt = (n, currency = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const tooltipPlugin = {
  backgroundColor: '#141b30',
  borderColor: 'rgba(255,255,255,0.08)',
  borderWidth: 1,
  titleColor: '#f1f5f9',
  bodyColor: '#8892a4',
  padding: 12,
  cornerRadius: 10,
};

export default function Analytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expenseAPI.getStats({ month: selectedMonth, year: selectedYear });
      setStats(res.data.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { load(); }, [load]);

  const totalIncome = stats?.monthlyStats?.find(s => s._id === 'income')?.total || 0;
  const totalExpense = stats?.monthlyStats?.find(s => s._id === 'expense')?.total || 0;

  // Trend data
  const trendData = (() => {
    if (!stats?.monthlyTrend) return null;
    const now = new Date();
    const incomeMap = {}, expenseMap = {};
    stats.monthlyTrend.forEach(({ _id, total }) => {
      const key = `${_id.year}-${_id.month}`;
      if (_id.type === 'income') incomeMap[key] = total;
      else expenseMap[key] = total;
    });
    const last6 = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { label: MONTHS[d.getMonth()], key: `${d.getFullYear()}-${d.getMonth() + 1}` };
    });
    return {
      labels: last6.map(m => m.label),
      datasets: [
        { label: 'Income', data: last6.map(m => incomeMap[m.key] || 0), backgroundColor: 'rgba(0,212,170,0.7)', borderRadius: 6 },
        { label: 'Expenses', data: last6.map(m => expenseMap[m.key] || 0), backgroundColor: 'rgba(244,63,94,0.7)', borderRadius: 6 },
      ]
    };
  })();

  const catData = {
    labels: stats?.categoryStats?.map(c => c._id) || [],
    datasets: [{
      data: stats?.categoryStats?.map(c => c.total) || [],
      backgroundColor: COLORS,
      borderWidth: 0,
      hoverOffset: 8,
    }]
  };

  const scaleStyle = {
    grid: { color: 'rgba(255,255,255,0.04)' },
    ticks: { color: '#8892a4', font: { size: 11 } },
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(0,212,170,0.2)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Deep dive into your spending patterns</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="input-field" style={{ width: 'auto' }} value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className="input-field" style={{ width: 'auto' }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Income', val: fmt(totalIncome, user?.currency), color: 'var(--accent-income)', icon: '📈' },
          { label: 'Total Expenses', val: fmt(totalExpense, user?.currency), color: 'var(--accent-expense)', icon: '📉' },
          { label: 'Net Savings', val: fmt(totalIncome - totalExpense, user?.currency), color: totalIncome - totalExpense >= 0 ? 'var(--accent-primary)' : 'var(--accent-expense)', icon: '💎' },
        ].map(({ label, val, color, icon }) => (
          <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
              <span style={{ fontSize: '1.2rem' }}>{icon}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>Income vs Expenses — Last 6 Months</h3>
          <div style={{ display: 'flex', gap: 16 }}>
            {[['rgba(0,212,170,0.7)', 'Income'], ['rgba(244,63,94,0.7)', 'Expenses']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 240 }}>
          {trendData ? <Bar data={trendData} options={{
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: tooltipPlugin },
            scales: { x: scaleStyle, y: { ...scaleStyle, ticks: { ...scaleStyle.ticks, callback: v => `${(v/1000).toFixed(0)}k` } } }
          }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>No trend data</div>}
        </div>
      </div>

      {/* Category breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Doughnut */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Spending by Category</h3>
          {stats?.categoryStats?.length > 0 ? (
            <>
              <div style={{ height: 220, position: 'relative' }}>
                <Doughnut data={catData} options={{
                  responsive: true, maintainAspectRatio: false, cutout: '70%',
                  plugins: { legend: { display: false }, tooltip: tooltipPlugin }
                }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Total Spent</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-expense)' }}>
                    {fmt(totalExpense, user?.currency)}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 220, color: 'var(--text-muted)', gap: 8 }}>
              <span style={{ fontSize: '2.5rem' }}>📊</span>
              <p style={{ fontSize: '0.875rem' }}>No expense data for this month</p>
            </div>
          )}
        </div>

        {/* Category list */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Category Breakdown</h3>
          {stats?.categoryStats?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.categoryStats.map((cat, i) => {
                const pct = totalExpense > 0 ? (cat.total / totalExpense * 100).toFixed(1) : 0;
                return (
                  <div key={cat._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{cat._id}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cat.count} txns</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(cat.total, user?.currency)}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{pct}%</div>
                      </div>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 100, width: `${pct}%`, background: COLORS[i % COLORS.length], transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', gap: 8 }}>
              <span style={{ fontSize: '2rem' }}>📭</span>
              <p style={{ fontSize: '0.875rem' }}>No data for selected period</p>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
