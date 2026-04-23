import React, { useState, useEffect } from 'react';
import { expenseAPI, categoryAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AddExpenseModal({ onClose, onSuccess, type: initialType = 'expense', editData = null }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState({ expense: [], income: [] });
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: editData?.title || '',
    amount: editData?.amount || '',
    type: editData?.type || initialType,
    category: editData?.category || '',
    date: editData?.date ? format(new Date(editData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    description: editData?.description || '',
    paymentMethod: editData?.paymentMethod || 'other',
    isRecurring: editData?.isRecurring || false,
  });

  useEffect(() => {
    categoryAPI.getAll().then(res => setCategories(res.data.data)).catch(() => {});
  }, []);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const currentCategories = categories[form.type] || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) return toast.error('Please select a category');
    setLoading(true);
    try {
      if (editData) {
        await expenseAPI.update(editData._id, { ...form, amount: Number(form.amount) });
        toast.success('Transaction updated!');
      } else {
        await expenseAPI.create({ ...form, amount: Number(form.amount) });
        toast.success(form.type === 'income' ? 'Income added! 💚' : 'Expense tracked! 📊');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800 }}>
            {editData ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button onClick={onClose} style={{
            background: 'var(--bg-glass-light)', border: '1px solid var(--border)',
            borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.1rem',
          }}>✕</button>
        </div>

        {/* Type toggle */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          background: 'var(--bg-glass-light)', borderRadius: 'var(--radius-md)',
          padding: 4, marginBottom: 20, border: '1px solid var(--border)',
        }}>
          {['expense', 'income'].map(t => (
            <button key={t} onClick={() => set('type', t)} style={{
              padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-body)',
              background: form.type === t ? (t === 'income' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)') : 'transparent',
              color: form.type === t ? (t === 'income' ? 'var(--accent-income)' : 'var(--accent-expense)') : 'var(--text-muted)',
              transition: 'var(--transition)',
            }}>
              {t === 'expense' ? '📉 Expense' : '📈 Income'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label>Title</label>
            <input type="text" className="input-field" placeholder="e.g. Lunch at Café, Salary..."
              value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label>Amount ({user?.currency})</label>
              <input type="number" className="input-field" placeholder="0.00" min="0.01" step="0.01"
                value={form.amount} onChange={e => set('amount', e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Date</label>
              <input type="date" className="input-field"
                value={form.date} onChange={e => set('date', e.target.value)} required />
            </div>
          </div>

          <div className="input-group">
            <label>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {currentCategories.map(cat => (
                <button key={cat.name} type="button" onClick={() => set('category', cat.name)} style={{
                  padding: '6px 12px', borderRadius: 100, fontSize: '0.78rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'var(--transition)', fontFamily: 'var(--font-body)',
                  border: `1px solid ${form.category === cat.name ? cat.color : 'var(--border)'}`,
                  background: form.category === cat.name ? `${cat.color}22` : 'transparent',
                  color: form.category === cat.name ? cat.color : 'var(--text-secondary)',
                }}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label>Payment Method</label>
              <select className="input-field" value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card</option>
                <option value="upi">📱 UPI</option>
                <option value="netbanking">🏦 Net Banking</option>
                <option value="other">📦 Other</option>
              </select>
            </div>
            <div className="input-group">
              <label>Recurring?</label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, height: 44,
                padding: '0 16px', background: 'var(--bg-glass-light)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              }} onClick={() => set('isRecurring', !form.isRecurring)}>
                <div style={{
                  width: 36, height: 20, borderRadius: 100, position: 'relative', transition: 'var(--transition)',
                  background: form.isRecurring ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', background: 'white',
                    position: 'absolute', top: 2, transition: 'var(--transition)',
                    left: form.isRecurring ? 18 : 2,
                  }} />
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {form.isRecurring ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          <div className="input-group">
            <label>Notes (optional)</label>
            <textarea className="input-field" placeholder="Add any notes..."
              value={form.description} onChange={e => set('description', e.target.value)}
              rows={2} style={{ resize: 'vertical', minHeight: 60 }} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
              {loading ? (
                <div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTop: '2px solid #0a0f1e', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : editData ? 'Update Transaction' : `Add ${form.type === 'income' ? 'Income' : 'Expense'}`}
            </button>
          </div>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
