import React, { useState, useEffect, useCallback } from 'react';
import { expenseAPI, categoryAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import AddExpenseModal from '../components/AddExpenseModal';

const fmt = (n, currency = 'INR') => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency, maximumFractionDigits: 0,
}).format(n);

const PAYMENT_ICONS = { cash: '💵', card: '💳', upi: '📱', netbanking: '🏦', other: '📦' };

export default function Transactions() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState({ type: '', category: '', startDate: '', endDate: '' });
  const [categories, setCategories] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    categoryAPI.getAll().then(res => {
      const all = [...res.data.data.expense, ...res.data.data.income];
      setCategories(all);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, sort: '-date', ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const res = await expenseAPI.getAll(params);
      setExpenses(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await expenseAPI.delete(id);
      toast.success('Deleted!');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.length} transactions?`)) return;
    try {
      await expenseAPI.bulkDelete(selected);
      toast.success(`${selected.length} transactions deleted`);
      setSelected([]);
      load();
    } catch { toast.error('Bulk delete failed'); }
  };

  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(selected.length === expenses.length ? [] : expenses.map(e => e._id));
  const setFilter = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };
  const clearFilters = () => { setFilters({ type: '', category: '', startDate: '', endDate: '' }); setPage(1); };

  const catIcon = (name) => categories.find(c => c.name === name)?.icon || '📦';
  const catColor = (name) => categories.find(c => c.name === name)?.color || '#8892a4';

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>Transactions</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {pagination.total} total transactions
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditData(null); setShowAdd(true); }}>
          + Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 20,
        display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap',
      }}>
        <div className="input-group" style={{ flex: 1, minWidth: 120 }}>
          <label>Type</label>
          <select className="input-field" value={filters.type} onChange={e => setFilter('type', e.target.value)}>
            <option value="">All Types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="input-group" style={{ flex: 2, minWidth: 160 }}>
          <label>Category</label>
          <select className="input-field" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <div className="input-group" style={{ flex: 1, minWidth: 140 }}>
          <label>From</label>
          <input type="date" className="input-field" value={filters.startDate} onChange={e => setFilter('startDate', e.target.value)} />
        </div>
        <div className="input-group" style={{ flex: 1, minWidth: 140 }}>
          <label>To</label>
          <input type="date" className="input-field" value={filters.endDate} onChange={e => setFilter('endDate', e.target.value)} />
        </div>
        <button className="btn btn-secondary" onClick={clearFilters} style={{ flexShrink: 0 }}>Clear</button>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div style={{
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
          borderRadius: 'var(--radius-md)', padding: '12px 20px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--accent-expense)', fontWeight: 600 }}>
            {selected.length} selected
          </span>
          <button className="btn btn-danger" onClick={handleBulkDelete}>
            🗑 Delete Selected
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 1fr 1fr 1fr 80px',
          padding: '12px 20px', borderBottom: '1px solid var(--border)',
          fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          <div><input type="checkbox" onChange={toggleAll} checked={selected.length === expenses.length && expenses.length > 0} style={{ accentColor: 'var(--accent-primary)' }} /></div>
          <div>Transaction</div>
          <div>Category</div>
          <div>Date</div>
          <div>Payment</div>
          <div>Amount</div>
          <div style={{ textAlign: 'right' }}>Actions</div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '2px solid rgba(0,212,170,0.2)', borderTop: '2px solid var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>No transactions found</p>
            <p style={{ fontSize: '0.875rem' }}>Try adjusting your filters or add a new transaction</p>
          </div>
        ) : (
          <div>
            {expenses.map((tx, i) => (
              <div key={tx._id} style={{
                display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 1fr 1fr 1fr 80px',
                padding: '14px 20px', borderBottom: i < expenses.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'var(--transition)', alignItems: 'center',
                background: selected.includes(tx._id) ? 'rgba(0,212,170,0.04)' : 'transparent',
              }}
              onMouseEnter={e => { if (!selected.includes(tx._id)) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (!selected.includes(tx._id)) e.currentTarget.style.background = 'transparent'; }}
              >
                <div>
                  <input type="checkbox" checked={selected.includes(tx._id)} onChange={() => toggleSelect(tx._id)}
                    style={{ accentColor: 'var(--accent-primary)' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: tx.type === 'income' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                  }}>{catIcon(tx.category)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tx.title}
                    </div>
                    {tx.description && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tx.description}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600,
                    background: `${catColor(tx.category)}18`,
                    color: catColor(tx.category),
                    border: `1px solid ${catColor(tx.category)}30`,
                  }}>
                    {tx.category}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {format(new Date(tx.date), 'MMM d, yyyy')}
                  {tx.isRecurring && <span style={{ marginLeft: 4 }}>🔄</span>}
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {PAYMENT_ICONS[tx.paymentMethod]} {tx.paymentMethod}
                </div>

                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem',
                  color: tx.type === 'income' ? 'var(--accent-income)' : 'var(--accent-expense)',
                }}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount, user?.currency)}
                </div>

                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  <button onClick={() => { setEditData(tx); setShowAdd(true); }} title="Edit"
                    style={{ width: 30, height: 30, borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', transition: 'var(--transition)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(tx._id)} title="Delete"
                    style={{ width: 30, height: 30, borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', transition: 'var(--transition)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-expense)'; e.currentTarget.style.color = 'var(--accent-expense)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Page {pagination.page} of {pagination.pages}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary" onClick={() => setPage(p => p - 1)} disabled={page <= 1}
                style={{ padding: '6px 14px', opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
              <button className="btn btn-secondary" onClick={() => setPage(p => p + 1)} disabled={page >= pagination.pages}
                style={{ padding: '6px 14px', opacity: page >= pagination.pages ? 0.4 : 1 }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <AddExpenseModal
          editData={editData}
          type={editData?.type || 'expense'}
          onClose={() => { setShowAdd(false); setEditData(null); }}
          onSuccess={() => { setShowAdd(false); setEditData(null); load(); }}
        />
      )}
    </div>
  );
}
