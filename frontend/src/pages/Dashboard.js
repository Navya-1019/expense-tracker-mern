import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { expenseAPI } from '../api';
import { format } from 'date-fns';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, PointElement, LineElement, Filler
} from 'chart.js';
import AddExpenseModal from '../components/AddExpenseModal';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const CATEGORY_COLORS = [
  '#00d4aa','#7c6ff7','#f59e0b','#f43f5e','#10b981',
  '#3b82f6','#ec4899','#8b5cf6','#06b6d4','#84cc16'
];

const fmt = (n, currency = 'INR') => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency, maximumFractionDigits: 0,
}).format(n);

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '22px 24px',
      transition: 'var(--transition)', position: 'relative', overflow: 'hidden',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        borderRadius: '0 0 0 100%',
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        <span style={{ fontSize: '1.3rem' }}>{icon}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color, marginBottom: 4 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState('expense');
  const now = new Date();

  const loadStats = useCallback(async () => {
    try {
      const res = await expenseAPI.getStats({ month: now.getMonth() + 1, year: now.getFullYear() });
      setStats(res.data.data);
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const totalIncome = stats?.monthlyStats?.find(s => s._id === 'income')?.total || 0;
  const totalExpense = stats?.monthlyStats?.find(s => s._id === 'expense')?.total || 0;
  const balance = totalIncome - totalExpense;
  const budgetUsed = user?.monthlyBudget ? (totalExpense / user.monthlyBudget) * 100 : 0;

  // Doughnut data
  const doughnutData = {
    labels: stats?.categoryStats?.map(c => c._id) || [],
    datasets: [{
      data: stats?.categoryStats?.map(c => c.total) || [],
      backgroundColor: CATEGORY_COLORS,
      borderWidth: 0,
      hoverOffset: 8,
    }]
  };

  // Line chart - monthly trend
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const trendData = (() => {
    if (!stats?.monthlyTrend) return null;
    const incomeByMonth = {};
    const expenseByMonth = {};
    stats.monthlyTrend.forEach(({ _id, total }) => {
      const key = `${_id.year}-${_id.month}`;
      if (_id.type === 'income') incomeByMonth[key] = total;
      else expenseByMonth[key] = total;
    });
    const last6 = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { label: months[d.getMonth()], key: `${d.getFullYear()}-${d.getMonth() + 1}` };
    });
    return {
      labels: last6.map(m => m.label),
      datasets: [
        {
          label: 'Income',
          data: last6.map(m => incomeByMonth[m.key] || 0),
          borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.08)',
          borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#00d4aa', fill: true, tension: 0.4,
        },
        {
          label: 'Expenses',
          data: last6.map(m => expenseByMonth[m.key] || 0),
          borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.08)',
          borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#f43f5e', fill: true, tension: 0.4,
        }
      ]
    };
  })();

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: '#141b30', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
      titleColor: '#f1f5f9', bodyColor: '#8892a4', padding: 12, cornerRadius: 10,
    }},
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892a4', fontSize: 11 } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892a4', callback: v => `${(v/1000).toFixed(0)}k` } }
    }
  };

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
      ))}
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>
            Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {format(now, 'EEEE, MMMM do yyyy')} · Here's your financial overview
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => { setAddType('income'); setShowAdd(true); }}>
            <span style={{ color: 'var(--accent-income)' }}>+</span> Income
          </button>
          <button className="btn btn-primary" onClick={() => { setAddType('expense'); setShowAdd(true); }}>
            + Add Expense
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Balance" value={fmt(balance, user?.currency)} icon="💎"
          color={balance >= 0 ? 'var(--accent-primary)' : 'var(--accent-expense)'}
          sub={`${format(now, 'MMMM yyyy')}`} />
        <StatCard label="Income" value={fmt(totalIncome, user?.currency)} icon="📈"
          color="var(--accent-income)" sub="This month" />
        <StatCard label="Expenses" value={fmt(totalExpense, user?.currency)} icon="📉"
          color="var(--accent-expense)" sub="This month" />
        <StatCard label="Savings Rate"
          value={totalIncome > 0 ? `${Math.round(((totalIncome - totalExpense) / totalIncome) * 100)}%` : '—'}
          icon="🎯" color="var(--accent-secondary)"
          sub={user?.monthlyBudget ? `Budget: ${fmt(user.monthlyBudget, user.currency)}` : 'No budget set'} />
      </div>

      {/* Budget bar */}
      {user?.monthlyBudget > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Monthly Budget Usage</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: budgetUsed > 90 ? 'var(--accent-expense)' : budgetUsed > 70 ? 'var(--accent-warning)' : 'var(--accent-income)' }}>
              {fmt(totalExpense, user.currency)} / {fmt(user.monthlyBudget, user.currency)}
            </span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 100, transition: 'width 0.6s ease',
              width: `${Math.min(budgetUsed, 100)}%`,
              background: budgetUsed > 90 ? 'var(--accent-expense)' : budgetUsed > 70 ? 'var(--accent-warning)' : 'var(--accent-primary)',
            }} />
          </div>
          {budgetUsed > 90 && (
            <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--accent-expense)' }}>
              ⚠️ You've used {Math.round(budgetUsed)}% of your monthly budget
            </div>
          )}
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Line chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>6-Month Trend</h3>
            <div style={{ display: 'flex', gap: 16 }}>
              {[['#00d4aa', 'Income'], ['#f43f5e', 'Expenses']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: 200 }}>
            {trendData ? <Line data={trendData} options={chartOpts} /> : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No trend data yet
              </div>
            )}
          </div>
        </div>

        {/* Doughnut */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>By Category</h3>
          {stats?.categoryStats?.length > 0 ? (
            <>
              <div style={{ height: 160 }}>
                <Doughnut data={doughnutData} options={{
                  responsive: true, maintainAspectRatio: false, cutout: '72%',
                  plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: '#141b30', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, titleColor: '#f1f5f9', bodyColor: '#8892a4', padding: 10, cornerRadius: 10 }
                  }
                }} />
              </div>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {stats.categoryStats.slice(0, 4).map((c, i) => (
                  <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[i], flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c._id}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(c.total, user?.currency)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, color: 'var(--text-muted)', gap: 8 }}>
              <div style={{ fontSize: '2rem' }}>📊</div>
              <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>Add expenses to see category breakdown</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>Recent Transactions</h3>
          <a href="/transactions" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}>View all →</a>
        </div>
        {stats?.recentTransactions?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {stats.recentTransactions.map(tx => (
              <div key={tx._id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                borderRadius: 'var(--radius-md)', transition: 'var(--transition)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: tx.type === 'income' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                }}>
                  {tx.type === 'income' ? '📈' : '💳'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tx.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {tx.category} · {format(new Date(tx.date), 'MMM d, yyyy')}
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem',
                  color: tx.type === 'income' ? 'var(--accent-income)' : 'var(--accent-expense)',
                  flexShrink: 0,
                }}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount, user?.currency)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💸</div>
            <p>No transactions yet. Add your first one!</p>
          </div>
        )}
      </div>

      {showAdd && (
        <AddExpenseModal
          type={addType}
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); loadStats(); }}
        />
      )}
    </div>
  );
}
