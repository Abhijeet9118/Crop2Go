import { useLanguage } from '../../context/LanguageContext';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { FiPlus, FiDollarSign } from 'react-icons/fi';
const categories = ['Seeds', 'Fertilizer', 'Labour', 'Pesticide', 'Equipment', 'Transport', 'Irrigation', 'Other'];
const catColors = {
  Seeds: '#22c55e',
  Fertilizer: '#f97316',
  Labour: '#3b82f6',
  Pesticide: '#ef4444',
  Equipment: '#8b5cf6',
  Transport: '#06b6d4',
  Irrigation: '#14b8a6',
  Other: '#6b7280'
};
export default function Expenses() {
  const {
    t
  } = useLanguage();
  const {
    user
  } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    category: 'Seeds',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const load = () => axios.get(`/api/farmers/${user.id}/expenses`).then(r => setExpenses(r.data.expenses || [])).catch(() => {});
  useEffect(() => {
    load();
  }, []);
  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const byCategory = categories.map(c => ({
    name: c,
    total: expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0)
  })).filter(c => c.total > 0);
  const submit = async e => {
    e.preventDefault();
    try {
      await axios.post(`/api/farmers/${user.id}/expenses`, form);
      toast.success('Expense added!');
      setShowModal(false);
      setForm({
        category: 'Seeds',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      load();
    } catch (err) {
      toast.error('Failed to add expense');
    }
  };
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("farmer_expenses_expenses_211", "Expenses")}</h1>
        <button onClick={() => setShowModal(true)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"><FiPlus />{t("farmer_expenses_add_expense_212", "Add Expense")}</button>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <p className="text-sm text-gray-500">{t("farmer_expenses_total_expenses_213", "Total Expenses")}</p>
        <p className="text-3xl font-bold text-gray-900">₹{total.toLocaleString()}</p>
        <div className="flex flex-wrap gap-3 mt-4">
          {byCategory.map(c => <div key={c.name} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{
            backgroundColor: catColors[c.name]
          }} />
              <span className="text-gray-600">{c.name}: ₹{c.total.toLocaleString()}</span>
            </div>)}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_expenses_date_214", "Date")}</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_expenses_category_215", "Category")}</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_expenses_description_216", "Description")}</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">{t("farmer_expenses_amount_217", "Amount")}</th>
          </tr></thead>
          <tbody className="divide-y">{expenses.map(e => <tr key={e.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">{e.date}</td>
              <td className="px-4 py-3 text-sm"><span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{
                  backgroundColor: catColors[e.category]
                }} />{e.category}</span></td>
              <td className="px-4 py-3 text-sm text-gray-500">{e.description || '-'}</td>
              <td className="px-4 py-3 text-sm text-right font-medium">₹{e.amount?.toLocaleString()}</td>
            </tr>)}</tbody>
        </table>
        {expenses.length === 0 && <p className="text-center text-gray-400 py-10">{t("farmer_expenses_no_expenses_recorded_218", "No expenses recorded yet")}</p>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t("farmer_expenses_add_expense_219", "Add Expense")}>
        <form onSubmit={submit} className="space-y-3">
          <select value={form.category} onChange={e => setForm(f => ({
          ...f,
          category: e.target.value
        }))} className="w-full px-4 py-3 border rounded-xl outline-none">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" placeholder={t("farmer_expenses_amount_220", "Amount (₹)")} value={form.amount} onChange={e => setForm(f => ({
          ...f,
          amount: e.target.value
        }))} className="w-full px-4 py-3 border rounded-xl outline-none" required />
          <input placeholder={t("farmer_expenses_description_221", "Description")} value={form.description} onChange={e => setForm(f => ({
          ...f,
          description: e.target.value
        }))} className="w-full px-4 py-3 border rounded-xl outline-none" />
          <input type="date" value={form.date} onChange={e => setForm(f => ({
          ...f,
          date: e.target.value
        }))} className="w-full px-4 py-3 border rounded-xl outline-none" />
          <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-medium">{t("farmer_expenses_add_expense_222", "Add Expense")}</button>
        </form>
      </Modal>
    </div>;
}