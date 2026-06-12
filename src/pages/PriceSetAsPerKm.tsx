import { useEffect, useState } from 'react';
import { fetchPriceSetAsPerKmList, fetchCarServiceCategoryList, createOrUpdatePriceSetAsPerKm, deletePriceSetAsPerKm } from '../utilities/api';
import type { PriceSetAsPerKmItem, CarServiceCategoryItem } from '../utilities/api';
import { useTranslation } from '../utilities/translation';
import { PopupMessage } from '../components/common/PopupMessage';

const inputCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm";
const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1";
const selectCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm";

export default function PriceSetAsPerKm() {
  const t = useTranslation();
  const [prices, setPrices] = useState<PriceSetAsPerKmItem[]>([]);
  const [serviceCategories, setServiceCategories] = useState<CarServiceCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<PriceSetAsPerKmItem | null>(null);
  const [selectedServiceCategoryUuid, setSelectedServiceCategoryUuid] = useState<string>('');
  const [pricePerKm, setPricePerKm] = useState<string>('');
  const [minimumBookingPrice, setMinimumBookingPrice] = useState<string>('');
  const [waitingTime, setWaitingTime] = useState<string>('');
  const [waitingPrice, setWaitingPrice] = useState<string>('');
  const [cancellationFee, setCancellationFee] = useState<string>('');
  const [busyStartTime, setBusyStartTime] = useState<string>('08:00:00');
  const [busyEndTime, setBusyEndTime] = useState<string>('10:30:00');
  const [busyTimePricePercentage, setBusyTimePricePercentage] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('BD');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'error', message: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteTargetUuid, setDeleteTargetUuid] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true); setError(null);
      let pricesData: PriceSetAsPerKmItem[] = [];
      let categoriesData: CarServiceCategoryItem[] = [];

      try {
        pricesData = await fetchPriceSetAsPerKmList();
      } catch (err: any) {
        if (err.response?.status === 404 || err.message?.includes('404')) {
          pricesData = [];
        } else {
          throw err;
        }
      }

      try {
        categoriesData = await fetchCarServiceCategoryList();
      } catch (err: any) {
        if (err.response?.status === 404 || err.message?.includes('404')) {
          categoriesData = [];
        } else {
          throw err;
        }
      }

      setPrices(pricesData);
      setServiceCategories(categoriesData);
    } catch (err: any) { setError(err.message || 'Error loading data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddClick = () => {
    setEditItem(null); setSelectedServiceCategoryUuid(serviceCategories[0]?.uuid || '');
    setPricePerKm(''); setMinimumBookingPrice(''); setWaitingTime(''); setWaitingPrice('');
    setCancellationFee(''); setBusyStartTime('08:00:00'); setBusyEndTime('10:30:00');
    setBusyTimePricePercentage(''); setCountryCode('BD'); setStatus('ACTIVE'); setFormError(null); setShowModal(true);
  };

  const handleEditClick = (item: PriceSetAsPerKmItem) => {
    setEditItem(item); setSelectedServiceCategoryUuid(item.car_service_category?.uuid || (serviceCategories[0]?.uuid || ''));
    setPricePerKm(item.price_per_km.toString()); setMinimumBookingPrice(item.minimum_booking_price.toString());
    setWaitingTime(item.waiting_time.toString()); setWaitingPrice(item.waiting_price.toString());
    setCancellationFee(item.cancellation_fee.toString()); setBusyStartTime(item.busy_start_time || '08:00:00');
    setBusyEndTime(item.busy_end_time || '10:30:00'); setBusyTimePricePercentage(item.busy_time_price_percentage.toString());
    setCountryCode(item.country_code || 'BD'); setStatus(item.status || 'ACTIVE'); setFormError(null); setShowModal(true);
  };

  const handleDeleteClick = (uuid: string) => { setDeleteTargetUuid(uuid); setShowDeleteConfirm(true); };

  const confirmDelete = async () => {
    if (!deleteTargetUuid) return;
    try {
      setLoading(true); setShowDeleteConfirm(false);
      const msg = await deletePriceSetAsPerKm(deleteTargetUuid);
      setDeleteTargetUuid(null); await loadData();
      setPopup({ show: true, type: 'success', message: msg || 'Deleted successfully' });
    } catch (err: any) {
      setDeleteTargetUuid(null);
      setPopup({ show: true, type: 'error', message: err.response?.data?.message || err.message || 'Failed to delete' });
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceCategoryUuid) { setFormError('Car Service Category is required'); return; }
    if (!pricePerKm || isNaN(Number(pricePerKm))) { setFormError('Price per KM must be a valid number'); return; }
    if (!minimumBookingPrice || isNaN(Number(minimumBookingPrice))) { setFormError('Minimum booking price must be a valid number'); return; }
    if (!waitingTime || isNaN(Number(waitingTime))) { setFormError('Waiting time must be a valid number'); return; }
    if (!waitingPrice || isNaN(Number(waitingPrice))) { setFormError('Waiting price must be a valid number'); return; }
    if (!cancellationFee || isNaN(Number(cancellationFee))) { setFormError('Cancellation fee must be a valid number'); return; }
    if (!busyStartTime.trim() || !busyEndTime.trim()) { setFormError('Busy hours start/end times are required'); return; }
    if (!busyTimePricePercentage || isNaN(Number(busyTimePricePercentage))) { setFormError('Busy time price percentage must be a valid number'); return; }
    if (!countryCode.trim()) { setFormError('Country code is required'); return; }
    try {
      setSubmitting(true); setFormError(null);
      const msg = await createOrUpdatePriceSetAsPerKm({
        price_per_km: Number(pricePerKm), minimum_booking_price: Number(minimumBookingPrice),
        waiting_time: Number(waitingTime), waiting_price: Number(waitingPrice),
        cancellation_fee: Number(cancellationFee), busy_start_time: busyStartTime.trim(),
        busy_end_time: busyEndTime.trim(), busy_time_price_percentage: Number(busyTimePricePercentage),
        country_code: countryCode.trim(), car_service_category_uuid: selectedServiceCategoryUuid,
        status, ...(editItem ? { uuid: editItem.uuid } : {})
      });
      setShowModal(false); await loadData();
      setPopup({ show: true, type: 'success', message: msg });
    } catch (err: any) { setFormError(err.response?.data?.message || err.message || 'Error saving.'); }
    finally { setSubmitting(false); }
  };

  const filteredPrices = prices.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (item.car_service_category?.service_name || '').toLowerCase().includes(q) ||
      (item.car_service_category?.car_category?.car_type || '').toLowerCase().includes(q) ||
      item.uuid.toLowerCase().includes(q) || item.country_code.toLowerCase().includes(q);
  });

  return (
    <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-lg font-bold text-white">{t('priceSetAsPerKm')} List</h2>
          <div className="relative">
            <input type="text" className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-56 transition-colors"
              placeholder="Search prices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAddClick} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-900/40">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Price Set
          </button>
          <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 text-sm font-medium rounded-lg transition-colors cursor-pointer">
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-x-auto">
        {loading && (<div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>)}
        {error && <div className="m-4 px-4 py-3 bg-rose-900/40 border border-rose-700 text-rose-300 rounded-lg text-sm">{error}</div>}
        {!loading && !error && (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-800/60 text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-3 py-3">SL</th>
                <th className="px-3 py-3">Service Category</th>
                <th className="px-3 py-3">Price/Km</th>
                <th className="px-3 py-3">Min Booking</th>
                <th className="px-3 py-3">Waiting</th>
                <th className="px-3 py-3">Cancel Fee</th>
                <th className="px-3 py-3">Busy Hours</th>
                <th className="px-3 py-3">Busy %</th>
                <th className="px-3 py-3">Country</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPrices.map((item, index) => (
                <tr key={item.uuid} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-3 py-3 text-slate-400 font-mono">{index + 1}</td>
                  <td className="px-3 py-3">
                    {item.car_service_category ? (
                      <div>
                        <p className="font-semibold text-slate-200 text-xs">{item.car_service_category.service_name}</p>
                        <p className="text-slate-500 text-xs">{item.car_service_category.car_category?.car_type || 'None'}</p>
                      </div>
                    ) : <span className="text-slate-500">None</span>}
                  </td>
                  <td className="px-3 py-3 text-emerald-400 font-bold">৳{item.price_per_km.toFixed(2)}</td>
                  <td className="px-3 py-3 text-slate-300">৳{item.minimum_booking_price.toFixed(2)}</td>
                  <td className="px-3 py-3">
                    <p className="text-slate-300 text-xs">{item.waiting_time} mins</p>
                    <p className="text-slate-500 text-xs">৳{item.waiting_price}/min</p>
                  </td>
                  <td className="px-3 py-3 text-slate-300">৳{item.cancellation_fee.toFixed(2)}</td>
                  <td className="px-3 py-3 text-slate-400 text-xs">{item.busy_start_time} – {item.busy_end_time}</td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-1 bg-amber-900/50 text-amber-300 text-xs font-bold rounded-md border border-amber-700/50">{item.busy_time_price_percentage}%</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-700">{item.country_code}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.status === 'ACTIVE' ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50' : 'bg-rose-900/50 text-rose-300 border border-rose-700/50'}`}>{item.status ?? 'ACTIVE'}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditClick(item)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors cursor-pointer">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteClick(item.uuid)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors cursor-pointer">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {prices.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-slate-500">No data found</td></tr>
              ) : filteredPrices.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-slate-500">No price configurations match the search query.</td></tr>
              ) : null}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-8">
              <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl">
                <h3 className="text-lg font-semibold text-white">{editItem ? 'Edit Price Set' : 'Add Price Set'}</h3>
                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {formError && <div className="px-3 py-2 bg-rose-900/40 border border-rose-700 text-rose-300 rounded-lg text-sm">{formError}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Car Service Category *</label>
                    <select className={selectCls} value={selectedServiceCategoryUuid} onChange={(e) => setSelectedServiceCategoryUuid(e.target.value)} required>
                      <option value="">Select Service Category</option>
                      {serviceCategories.map(sc => <option key={sc.uuid} value={sc.uuid}>{sc.service_name} (Car: {sc.car_category?.car_type || 'None'})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Status *</label>
                    <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)} required>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Price Per KM *</label>
                    <input type="number" step="0.01" className={inputCls} placeholder="e.g. 15.00" value={pricePerKm} onChange={(e) => setPricePerKm(e.target.value)} required />
                  </div>
                  <div>
                    <label className={labelCls}>Minimum Booking Price *</label>
                    <input type="number" step="0.01" className={inputCls} placeholder="e.g. 100.00" value={minimumBookingPrice} onChange={(e) => setMinimumBookingPrice(e.target.value)} required />
                  </div>
                  <div>
                    <label className={labelCls}>Waiting Time (Minutes) *</label>
                    <input type="number" className={inputCls} placeholder="e.g. 10" value={waitingTime} onChange={(e) => setWaitingTime(e.target.value)} required />
                  </div>
                  <div>
                    <label className={labelCls}>Waiting Price (Per Min) *</label>
                    <input type="number" step="0.01" className={inputCls} placeholder="e.g. 1.50" value={waitingPrice} onChange={(e) => setWaitingPrice(e.target.value)} required />
                  </div>
                  <div>
                    <label className={labelCls}>Cancellation Fee *</label>
                    <input type="number" step="0.01" className={inputCls} placeholder="e.g. 50.00" value={cancellationFee} onChange={(e) => setCancellationFee(e.target.value)} required />
                  </div>
                  <div>
                    <label className={labelCls}>Country Code *</label>
                    <input type="text" className={inputCls} placeholder="e.g. BD" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} required />
                  </div>
                  <div>
                    <label className={labelCls}>Busy Start Time (HH:MM:SS) *</label>
                    <input type="text" className={inputCls} placeholder="e.g. 08:00:00" value={busyStartTime} onChange={(e) => setBusyStartTime(e.target.value)} required />
                  </div>
                  <div>
                    <label className={labelCls}>Busy End Time (HH:MM:SS) *</label>
                    <input type="text" className={inputCls} placeholder="e.g. 10:30:00" value={busyEndTime} onChange={(e) => setBusyEndTime(e.target.value)} required />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Busy Time Price Percentage (%) *</label>
                    <input type="number" className={inputCls} placeholder="e.g. 10" value={busyTimePricePercentage} onChange={(e) => setBusyTimePricePercentage(e.target.value)} required />
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

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
              <div className="bg-gradient-to-r from-rose-600 to-red-600 p-4 flex items-center gap-3">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <h3 className="text-white font-semibold text-lg">Confirm Delete</h3>
              </div>
              <div className="p-6 text-center">
                <p className="text-slate-300">Are you sure you want to delete this price set?</p>
                <p className="text-slate-500 text-sm mt-1">This action cannot be undone.</p>
              </div>
              <div className="flex justify-end gap-3 px-6 pb-5">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteTargetUuid(null); }} className="px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">Cancel</button>
                <button onClick={confirmDelete} className="px-5 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer">Yes, Delete</button>
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"></div>
        </>
      )}
    </div>
  );
}
