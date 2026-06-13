import { useEffect, useState } from 'react';
import { fetchCarServiceCategoryList, fetchCarCategoryList, createOrUpdateCarServiceCategory, deleteCarServiceCategory } from '../services/settingsApi';
import { newwork_image_url } from '../../../shared/utils/constants';
import type { CarServiceCategoryItem, CarCategoryItem } from '../services/types';
import { useTranslation } from '../../../shared/utils/translation';
import noImage from '../../../shared/assets/images/no-image.png';
import { PopupMessage } from '../../../shared/components/PopupMessage';

const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1";
const selectCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm";

export default function CarServiceCategoryList() {
  const t = useTranslation();
  const [serviceCategories, setServiceCategories] = useState<CarServiceCategoryItem[]>([]);
  const [carCategories, setCarCategories] = useState<CarCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<CarServiceCategoryItem | null>(null);
  const [serviceName, setServiceName] = useState<string>('');
  const [selectedCategoryUuid, setSelectedCategoryUuid] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [serviceAvatar, setServiceAvatar] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'error', message: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteTargetUuid, setDeleteTargetUuid] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true); setError(null);
      const [serviceData, categoryData] = await Promise.all([fetchCarServiceCategoryList(), fetchCarCategoryList()]);
      setServiceCategories(serviceData); setCarCategories(categoryData);
    } catch (err: any) { setError(err.message || 'Error loading data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddClick = () => { setEditItem(null); setServiceName('INTER_CITY_RENTER'); setSelectedCategoryUuid(carCategories[0]?.uuid || ''); setStatus('ACTIVE'); setServiceAvatar(null); setFormError(null); setShowModal(true); };
  const handleEditClick = (item: CarServiceCategoryItem) => { setEditItem(item); setServiceName(item.service_name); setSelectedCategoryUuid(item.car_category?.uuid || (carCategories[0]?.uuid || '')); setStatus(item.status || 'ACTIVE'); setServiceAvatar(null); setFormError(null); setShowModal(true); };
  const handleDeleteClick = (uuid: string) => { setDeleteTargetUuid(uuid); setShowDeleteConfirm(true); };

  const confirmDelete = async () => {
    if (!deleteTargetUuid) return;
    try {
      setLoading(true); setShowDeleteConfirm(false);
      const msg = await deleteCarServiceCategory(deleteTargetUuid);
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
    if (!serviceName.trim()) { setFormError('Service Name is required'); return; }
    if (!selectedCategoryUuid) { setFormError('Please select a Car Category'); return; }
    try {
      setSubmitting(true); setFormError(null);
      const msg = await createOrUpdateCarServiceCategory({ service_name: serviceName.trim(), car_category_uuid: selectedCategoryUuid, status, service_avatar: serviceAvatar, ...(editItem ? { uuid: editItem.uuid } : {}) });
      setShowModal(false); await loadData();
      setPopup({ show: true, type: 'success', message: msg });
    } catch (err: any) { setFormError(err.response?.data?.message || err.message || 'Error saving.'); }
    finally { setSubmitting(false); }
  };

  const filteredCategories = serviceCategories.filter((item) => {
    const q = searchQuery.toLowerCase();
    return item.service_name.toLowerCase().includes(q) || item.uuid.toLowerCase().includes(q) || (item.car_category?.car_type || '').toLowerCase().includes(q);
  });

  return (
    <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-lg font-bold text-white">{t('carServiceCategory')} List</h2>
          <div className="relative">
            <input type="text" className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-60 transition-colors"
              placeholder="Search service categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAddClick} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-900/40">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Service Category
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
                <th className="px-4 py-3 w-16">SL</th>
                <th className="px-4 py-3">UUID</th>
                <th className="px-4 py-3">Avatar</th>
                <th className="px-4 py-3">Service Name</th>
                <th className="px-4 py-3">Car Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCategories.map((item, index) => {
                const avatarUrl = item.avatar ? (item.avatar.startsWith('http') ? item.avatar : `${newwork_image_url}${item.avatar}`) : noImage;
                return (
                  <tr key={item.uuid} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono">{index + 1}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500 max-w-xs truncate">{item.uuid}</td>
                    <td className="px-4 py-3">
                      <img src={avatarUrl} alt={item.service_name} className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-700 cursor-pointer hover:ring-indigo-500 transition-all"
                        onClick={() => setPreviewImage({ url: avatarUrl, title: item.service_name })}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = noImage; }} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{item.service_name}</td>
                    <td className="px-4 py-3">
                      {item.car_category ? (
                        <span className="px-2.5 py-1 bg-indigo-900/50 text-indigo-300 rounded-md text-xs font-semibold border border-indigo-700/50">{item.car_category.car_type}</span>
                      ) : <span className="text-slate-500">None</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.status === 'ACTIVE' ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50' : 'bg-rose-900/50 text-rose-300 border border-rose-700/50'}`}>{item.status ?? 'ACTIVE'}</span>
                    </td>
                    <td className="px-4 py-3">
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
                );
              })}
              {filteredCategories.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No car service categories match the search query.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl">
                <h3 className="text-lg font-semibold text-white">{editItem ? 'Edit Service Category' : 'Add Service Category'}</h3>
                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {formError && <div className="px-3 py-2 bg-rose-900/40 border border-rose-700 text-rose-300 rounded-lg text-sm">{formError}</div>}
                <div>
                  <label className={labelCls}>Service Name *</label>
                  <select className={selectCls} value={serviceName} onChange={(e) => setServiceName(e.target.value)} required>
                    {['INTER_CITY_RENTER','WEDDING_CAR','HOURLY','AIRPORT_RENTER','RETURN','OUTSTATION_RIDE','PACKAGE_DELIVERY','RIDE_SHARE'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Car Category *</label>
                  <select className={selectCls} value={selectedCategoryUuid} onChange={(e) => setSelectedCategoryUuid(e.target.value)} required>
                    <option value="">Select Category</option>
                    {carCategories.map(cat => <option key={cat.uuid} value={cat.uuid}>{cat.car_type} (Capacity: {cat.set_capacity})</option>)}
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
                  <label className={labelCls}>Service Avatar</label>
                  {serviceAvatar ? (
                    <div className="mb-2 flex items-center gap-2">
                      <img src={URL.createObjectURL(serviceAvatar)} alt="preview" className="h-12 w-12 object-contain rounded-lg border border-slate-700" />
                      <span className="text-xs text-slate-400">{serviceAvatar.name}</span>
                    </div>
                  ) : editItem?.avatar ? (
                    <img src={editItem.avatar.startsWith('http') ? editItem.avatar : `${newwork_image_url}${editItem.avatar}`} alt="current" className="h-12 w-12 object-contain rounded-lg border border-slate-700 mb-2" />
                  ) : null}
                  <input type="file" className="block w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-700 file:text-slate-300 hover:file:bg-slate-600 file:cursor-pointer" accept="image/*"
                    onChange={(e) => { if (e.target.files?.[0]) setServiceAvatar(e.target.files[0]); }} />
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

      {/* Preview Image */}
      {previewImage && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
                <h3 className="text-white font-semibold">{previewImage.title}</h3>
                <button onClick={() => setPreviewImage(null)} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-4 flex justify-center bg-slate-950">
                <img src={previewImage.url} alt={previewImage.title} className="max-w-full max-h-72 object-contain" />
              </div>
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
                <p className="text-slate-300">Are you sure you want to delete this service category?</p>
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
