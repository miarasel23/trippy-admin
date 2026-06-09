import { useEffect, useState } from 'react';
import { fetchDriverSubscriptionList, fetchCarCategoryList, createOrUpdateDriverSubscription } from '../utilities/api';
import type { DriverSubscriptionItem, CarCategoryItem } from '../utilities/api';
import { useTranslation } from '../utilities/translation';
import { PopupMessage } from '../components/common/PopupMessage';

const inputCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm";
const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1";
const selectCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm";

export default function DriverSubscriptionList() {
  const t = useTranslation();
  const [subscriptions, setSubscriptions] = useState<DriverSubscriptionItem[]>([]);
  const [carCategories, setCarCategories] = useState<CarCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<DriverSubscriptionItem | null>(null);
  const [subscriptionType, setSubscriptionType] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [previousPrice, setPreviousPrice] = useState<string>('');
  const [validateFor, setValidateFor] = useState<string>('');
  const [selectedCategoryUuid, setSelectedCategoryUuid] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [flagOne, setFlagOne] = useState<string>('1');
  const [flagTwo, setFlagTwo] = useState<string>('2');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'error', message: '' });

  const loadData = async () => {
    try {
      setLoading(true); setError(null);
      const [subsData, categoriesData] = await Promise.all([fetchDriverSubscriptionList(), fetchCarCategoryList()]);
      setSubscriptions(subsData); setCarCategories(categoriesData);
    } catch (err: any) { setError(err.message || 'Error loading data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleEditClick = (item: DriverSubscriptionItem) => {
    setEditItem(item); setSubscriptionType(item.subscription_type); setPrice(item.price.toString());
    setPreviousPrice(item.previous_price.toString()); setValidateFor(item.validate_for.toString());
    setStatus(item.status); setFlagOne(item.flag_one ? item.flag_one.toString() : '1');
    setFlagTwo(item.flag_two ? item.flag_two.toString() : '2');
    setSelectedCategoryUuid((item as any).car_categories_uuid || (carCategories[0]?.uuid || ''));
    setFormError(null); setShowModal(true);
  };

  const handleAddClick = () => {
    setEditItem(null); setSubscriptionType('REGISTRATION_PACKAGE'); setPrice(''); setPreviousPrice('');
    setValidateFor(''); setStatus('ACTIVE'); setFlagOne('1'); setFlagTwo('2');
    setSelectedCategoryUuid(carCategories[0]?.uuid || ''); setFormError(null); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriptionType.trim()) { setFormError('Subscription Type is required'); return; }
    if (!price || isNaN(Number(price))) { setFormError('Valid Price is required'); return; }
    if (!previousPrice || isNaN(Number(previousPrice))) { setFormError('Valid Previous Price is required'); return; }
    if (!validateFor || isNaN(Number(validateFor))) { setFormError('Valid Validate For (Days) is required'); return; }
    if (!selectedCategoryUuid) { setFormError('Please select a Car Category'); return; }
    try {
      setSubmitting(true); setFormError(null);
      const msg = await createOrUpdateDriverSubscription({ subscription_type: subscriptionType.trim(), price: Number(price), previous_price: Number(previousPrice), validate_for: Number(validateFor), car_categories_uuid: selectedCategoryUuid, status, flag_one: Number(flagOne), flag_two: Number(flagTwo), ...(editItem ? { uuid: editItem.uuid } : {}) });
      setShowModal(false); await loadData();
      setPopup({ show: true, type: 'success', message: msg });
    } catch (err: any) { setFormError(err.response?.data?.message || err.message || 'Error saving.'); }
    finally { setSubmitting(false); }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const q = searchQuery.toLowerCase();
    return sub.subscription_type.toLowerCase().includes(q) || sub.status.toLowerCase().includes(q) || sub.uuid.toLowerCase().includes(q) || sub.price.toString().includes(q);
  });

  return (
    <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-lg font-bold text-white">{t('driverSubscription')} List</h2>
          <div className="relative">
            <input type="text" className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-56 transition-colors"
              placeholder="Search subscriptions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAddClick} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-900/40">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Subscription
          </button>
          <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 text-sm font-medium rounded-lg transition-colors cursor-pointer">
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading && (<div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>)}
        {error && <div className="m-4 px-4 py-3 bg-rose-900/40 border border-rose-700 text-rose-300 rounded-lg text-sm">{error}</div>}
        {!loading && !error && (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-800/60 text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3 w-14">SL</th>
                <th className="px-4 py-3">UUID</th>
                <th className="px-4 py-3">Subscription Type</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Prev. Price</th>
                <th className="px-4 py-3">Validate (Days)</th>
                <th className="px-4 py-3">Flag 1</th>
                <th className="px-4 py-3">Flag 2</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSubscriptions.map((item, index) => (
                <tr key={item.uuid} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono">{index + 1}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500 max-w-xs truncate">{item.uuid}</td>
                  <td className="px-4 py-3"><span className="px-2.5 py-1 bg-indigo-900/50 text-indigo-300 rounded-md text-xs font-semibold border border-indigo-700/50">{item.subscription_type}</span></td>
                  <td className="px-4 py-3 text-emerald-400 font-bold">৳{item.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-500 line-through">৳{item.previous_price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-300">{item.validate_for} days</td>
                  <td className="px-4 py-3 text-slate-400">{item.flag_one ?? 'N/A'}</td>
                  <td className="px-4 py-3 text-slate-400">{item.flag_two ?? 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.status === 'ACTIVE' ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50' : 'bg-rose-900/50 text-rose-300 border border-rose-700/50'}`}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(item.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEditClick(item)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors cursor-pointer">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSubscriptions.length === 0 && (<tr><td colSpan={11} className="px-4 py-12 text-center text-slate-500">No driver subscriptions match the search query.</td></tr>)}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-8">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl">
                <h3 className="text-lg font-semibold text-white">{editItem ? 'Edit Driver Subscription' : 'Add Driver Subscription'}</h3>
                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {formError && <div className="px-3 py-2 bg-rose-900/40 border border-rose-700 text-rose-300 rounded-lg text-sm">{formError}</div>}
                <div>
                  <label className={labelCls}>Subscription Type *</label>
                  <select className={selectCls} value={subscriptionType} onChange={(e) => setSubscriptionType(e.target.value)} required>
                    {['REGISTRATION_PACKAGE','BASIC','STANDARD','SAVING','SUPER_SAVING'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Price *</label><input type="number" step="0.01" className={inputCls} placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
                  <div><label className={labelCls}>Previous Price *</label><input type="number" step="0.01" className={inputCls} placeholder="0.00" value={previousPrice} onChange={(e) => setPreviousPrice(e.target.value)} required /></div>
                  <div><label className={labelCls}>Validate For (Days) *</label><input type="number" className={inputCls} placeholder="e.g. 30" value={validateFor} onChange={(e) => setValidateFor(e.target.value)} required /></div>
                  <div>
                    <label className={labelCls}>Car Category *</label>
                    <select className={selectCls} value={selectedCategoryUuid} onChange={(e) => setSelectedCategoryUuid(e.target.value)} required>
                      <option value="">Select Category</option>
                      {carCategories.map(cat => <option key={cat.uuid} value={cat.uuid}>{cat.car_type}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Status *</label>
                  <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)} required>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Flag One *</label>
                    <select className={selectCls} value={flagOne} onChange={(e) => setFlagOne(e.target.value)} required>
                      {Array.from({ length: 50 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Flag Two *</label>
                    <select className={selectCls} value={flagTwo} onChange={(e) => setFlagTwo(e.target.value)} required>
                      {Array.from({ length: 50 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 rounded-lg transition-colors cursor-pointer">
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"></div>
        </>
      )}

      <PopupMessage show={popup.show} type={popup.type} message={popup.message} onClose={() => setPopup(prev => ({ ...prev, show: false }))} />
    </div>
  );
}
