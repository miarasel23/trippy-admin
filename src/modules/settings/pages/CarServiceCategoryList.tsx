import React, { useEffect, useState, useMemo } from 'react';
import { fetchCarServiceCategoryList, fetchCarCategoryList, createOrUpdateCarServiceCategory, deleteCarServiceCategory } from '../services/settingsApi';
import { newwork_image_url } from '../../../shared/utils/constants';
import type { CarServiceCategoryItem, CarCategoryItem } from '../services/types';
import { useTranslation } from '../../../shared/utils/translation';
import noImage from '../../../shared/assets/images/no-image.png';
import { PopupMessage } from '../../../shared/components/PopupMessage';

const labelCls = "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5";
const selectCls = "w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/50 transition-all text-sm";
const inputCls = "w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/50 transition-all text-sm";

export default function CarServiceCategoryList() {
  const t = useTranslation();
  const [serviceCategories, setServiceCategories] = useState<CarServiceCategoryItem[]>([]);
  const [carCategories, setCarCategories] = useState<CarCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<CarServiceCategoryItem | null>(null);
  const [serviceName, setServiceName] = useState<string>('');
  const [selectedCategoryUuid, setSelectedCategoryUuid] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [serviceAvatar, setServiceAvatar] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Popups & Deletes
  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'error', message: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteTargetUuid, setDeleteTargetUuid] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true); setError(null);
      const [serviceData, categoryData] = await Promise.all([
        fetchCarServiceCategoryList(),
        fetchCarCategoryList()
      ]);
      setServiceCategories(serviceData);
      setCarCategories(categoryData);
    } catch (err: any) {
      setError(err.message || 'Error loading service categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Action Click Handlers
  const handleAddClick = () => {
    setEditItem(null);
    setServiceName('RIDE_SHARE');
    setSelectedCategoryUuid(carCategories[0]?.uuid || '');
    setStatus('ACTIVE');
    setServiceAvatar(null);
    setFormError(null);
    setShowModal(true);
  };

  const handleMapVehicleClick = (srvName: string) => {
    setEditItem(null);
    setServiceName(srvName);
    setSelectedCategoryUuid(carCategories[0]?.uuid || '');
    setStatus('ACTIVE');
    setServiceAvatar(null);
    setFormError(null);
    setShowModal(true);
  };

  const handleEditClick = (item: CarServiceCategoryItem) => {
    setEditItem(item);
    setServiceName(item.service_name);
    setSelectedCategoryUuid(item.car_category?.uuid || (carCategories[0]?.uuid || ''));
    setStatus(item.status || 'ACTIVE');
    setServiceAvatar(null);
    setFormError(null);
    setShowModal(true);
  };

  const handleDeleteClick = (uuid: string) => {
    setDeleteTargetUuid(uuid);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetUuid) return;
    try {
      setLoading(true);
      setShowDeleteConfirm(false);
      const msg = await deleteCarServiceCategory(deleteTargetUuid);
      setDeleteTargetUuid(null);
      await loadData();
      setPopup({ show: true, type: 'success', message: msg || 'Mapping deleted successfully' });
    } catch (err: any) {
      setDeleteTargetUuid(null);
      setPopup({ show: true, type: 'error', message: err.response?.data?.message || err.message || 'Failed to delete category mapping' });
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) { setFormError('Service Name is required'); return; }
    if (!selectedCategoryUuid) { setFormError('Please select a Car Category'); return; }
    try {
      setSubmitting(true);
      setFormError(null);
      const msg = await createOrUpdateCarServiceCategory({
        service_name: serviceName.trim(),
        car_category_uuid: selectedCategoryUuid,
        status,
        service_avatar: serviceAvatar,
        ...(editItem ? { uuid: editItem.uuid } : {})
      });
      setShowModal(false);
      await loadData();
      setPopup({ show: true, type: 'success', message: msg });
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Error saving category mapping');
    } finally {
      setSubmitting(false);
    }
  };

  // Group flattened category arrays back to hierarchical structure for visual grouping
  const serviceGroups = useMemo(() => {
    const groups: Record<string, {
      service_name: string;
      service_uuid: string;
      avatar?: string | null;
      status: string;
      mappings: {
        item: CarServiceCategoryItem;
        mapping_uuid: string;
        car_id: number;
        car_uuid: string;
        car_type: string;
        set_capacity: number | string;
        car_avatar?: string | null;
        sort_order?: number | null;
        status: string;
      }[];
    }> = {};

    serviceCategories.forEach((item) => {
      const sKey = item.service_name;
      if (!groups[sKey]) {
        groups[sKey] = {
          service_name: item.service_name,
          service_uuid: item.car_service_category_uuid || item.uuid,
          avatar: item.avatar,
          status: item.status || 'ACTIVE',
          mappings: []
        };
      }
      if (item.car_category) {
        groups[sKey].mappings.push({
          item: item,
          mapping_uuid: item.uuid,
          car_id: item.car_category.id,
          car_uuid: item.car_category.uuid,
          car_type: item.car_category.car_type,
          set_capacity: item.car_category.set_capacity || 0,
          car_avatar: item.car_category.car_avatar,
          sort_order: item.car_category.sort_order,
          status: item.car_category.status || 'ACTIVE'
        });
      }
    });

    return Object.values(groups);
  }, [serviceCategories]);

  // Tab configurations: "ALL" + dynamically created category tab keys
  const tabKeys = useMemo(() => ['ALL', ...serviceGroups.map(g => g.service_name)], [serviceGroups]);

  // Filter visible items depending on active Tab and search queries
  const visibleGroups = useMemo(() => {
    let base = serviceGroups;
    if (activeTab !== 'ALL') {
      base = serviceGroups.filter(g => g.service_name === activeTab);
    }

    const q = searchQuery.toLowerCase();
    if (!q) return base;

    return base.filter(group =>
      group.service_name.toLowerCase().includes(q) ||
      group.mappings.some(m => m.car_type.toLowerCase().includes(q))
    ).map(group => {
      if (group.service_name.toLowerCase().includes(q)) return group;
      return {
        ...group,
        mappings: group.mappings.filter(m => m.car_type.toLowerCase().includes(q))
      };
    });
  }, [serviceGroups, activeTab, searchQuery]);

  const getServiceLabel = (name: string) => {
    return name.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6">

      {/* ── Filter & Search Toolbar ── */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">{t('carServiceCategory')} List</h2>
          <p className="text-slate-400 text-xs mt-1">Configure ride categories and vehicle options</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              className="pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 text-sm w-64 transition-all"
              placeholder="Search category or vehicle…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Add Category mapping button */}
          <button onClick={handleAddClick} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-950/40 border border-indigo-500/30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Add Mapping
          </button>

          {/* Refresh button */}
          <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 disabled:opacity-50 text-slate-300 text-sm font-medium rounded-xl transition-all cursor-pointer">
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      {!loading && !error && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {tabKeys.map((key) => {
            const isActive = activeTab === key;
            const count = key === 'ALL'
              ? serviceCategories.length
              : serviceCategories.filter(sc => sc.service_name === key).length;

            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                {key === 'ALL' ? 'All Services' : getServiceLabel(key)}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Main View Body ── */}
      <div>
        {loading && (
          <div className="flex flex-col items-center justify-center py-28 bg-slate-900 border border-slate-800 rounded-2xl gap-4">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-slate-400 text-xs font-semibold">Fetching categories…</p>
          </div>
        )}

        {error && (
          <div className="px-5 py-4 bg-rose-950/20 border border-rose-700/50 text-rose-300 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        {!loading && !error && (
          visibleGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
              <svg className="w-12 h-12 mb-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold text-slate-400 text-sm">No service categories match your parameters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleGroups.map((group) => {
                const serviceAvatarUrl = group.avatar
                  ? (group.avatar.startsWith('http') ? group.avatar : `${newwork_image_url}${group.avatar}`)
                  : noImage;

                return (
                  <div key={group.service_name} className="flex flex-col bg-slate-900 border border-slate-800/80 rounded-2xl shadow-xl hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/5 hover:border-slate-700/60 transition-all duration-300 overflow-hidden">
                    
                    {/* Card Header */}
                    <div className="p-5 border-b border-slate-850 flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-center p-1.5 shrink-0 shadow-md">
                        <img
                          src={serviceAvatarUrl}
                          alt={group.service_name}
                          className="w-full h-full object-contain rounded-xl cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setPreviewImage({ url: serviceAvatarUrl, title: getServiceLabel(group.service_name) })}
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = noImage; }}
                        />
                      </div>
                      
                      {/* Service Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-md font-bold text-white leading-snug truncate">{getServiceLabel(group.service_name)}</h3>
                        <p className="text-slate-500 text-[10px] font-mono mt-0.5 truncate">{group.service_uuid}</p>
                        
                        {/* Status badge */}
                        <div className="mt-2.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                            group.status === 'ACTIVE'
                              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40'
                              : 'bg-rose-950/30 text-rose-400 border-rose-800/40'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${group.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            {group.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Mapped Vehicles List */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mapped Vehicles</span>
                        <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">{group.mappings.length}</span>
                      </div>

                      {group.mappings.length === 0 ? (
                        <div className="flex-1 py-8 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl">
                          <p className="text-xs text-slate-500 italic">No vehicles mapped yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3 flex-1">
                          {group.mappings.map((map) => {
                            const carAvatarUrl = map.car_avatar
                              ? (map.car_avatar.startsWith('http') ? map.car_avatar : `${newwork_image_url}${map.car_avatar}`)
                              : noImage;

                            return (
                              <div key={map.mapping_uuid} className="group/item flex items-center justify-between p-3.5 bg-slate-950/30 border border-slate-800/40 rounded-xl hover:bg-slate-950/60 hover:border-slate-800 transition-all">
                                <div className="flex items-center gap-3">
                                  {/* Vehicle icon */}
                                  <img
                                    src={carAvatarUrl}
                                    alt={map.car_type}
                                    className="w-10 h-7 object-contain bg-slate-900 border border-slate-800 rounded-lg p-0.5 shrink-0"
                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = noImage; }}
                                  />
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-200">{map.car_type.replace(/_/g, ' ')}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] text-slate-500 font-medium">{map.set_capacity} Seats</span>
                                      <span className="text-[9px] font-bold text-slate-500 bg-slate-850 px-1.5 py-0.2 rounded font-mono">#{map.sort_order ?? 0}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Item Actions */}
                                <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleEditClick(map.item)}
                                    className="p-1.5 hover:bg-indigo-600/10 text-slate-400 hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                                    title="Edit assignment"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(map.mapping_uuid)}
                                    className="p-1.5 hover:bg-rose-600/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                    title="Remove assignment"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="px-5 py-4.5 bg-slate-950/20 border-t border-slate-850 flex items-center justify-between">
                      <button
                        onClick={() => handleMapVehicleClick(group.service_name)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-600/5 text-slate-400 hover:text-indigo-400 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        Map Vehicle
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl border-b border-slate-700/40">
                <h3 className="text-base font-bold text-white">{editItem ? 'Edit Vehicle Mapping' : 'Map Vehicle to Service'}</h3>
                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {formError && <div className="px-3.5 py-2.5 bg-rose-900/30 border border-rose-700/40 text-rose-300 rounded-xl text-xs font-medium">{formError}</div>}
                
                <div>
                  <label className={labelCls}>Service Name *</label>
                  <select className={selectCls} value={serviceName} onChange={(e) => setServiceName(e.target.value)} required>
                    {['INTER_CITY_RENTER','WEDDING_CAR','HOURLY','AIRPORT_RENTER','RETURN','OUTSTATION_RIDE','PACKAGE_DELIVERY','RIDE_SHARE'].map(v => (
                      <option key={v} value={v}>{getServiceLabel(v)}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={labelCls}>Car Category *</label>
                  <select className={selectCls} value={selectedCategoryUuid} onChange={(e) => setSelectedCategoryUuid(e.target.value)} required>
                    <option value="">Select Category</option>
                    {carCategories.map(cat => (
                      <option key={cat.uuid} value={cat.uuid}>{cat.car_type.replace(/_/g, ' ')} (Capacity: {cat.set_capacity} seats)</option>
                    ))}
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
                  <label className={labelCls}>Service Avatar Image</label>
                  {serviceAvatar ? (
                    <div className="mb-3 flex items-center gap-3 bg-slate-950/40 border border-slate-800 p-2 rounded-xl">
                      <img src={URL.createObjectURL(serviceAvatar)} alt="preview" className="h-10 w-10 object-contain rounded-lg border border-slate-700 bg-slate-900" />
                      <span className="text-xs text-slate-400 font-mono truncate max-w-[200px]">{serviceAvatar.name}</span>
                    </div>
                  ) : editItem?.avatar ? (
                    <div className="mb-3">
                      <img src={editItem.avatar.startsWith('http') ? editItem.avatar : `${newwork_image_url}${editItem.avatar}`} alt="current" className="h-10 w-10 object-contain rounded-lg border border-slate-855 bg-slate-900" />
                    </div>
                  ) : null}
                  <input type="file" className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 file:cursor-pointer file:font-semibold" accept="image/*"
                    onChange={(e) => { if (e.target.files?.[0]) setServiceAvatar(e.target.files[0]); }} />
                </div>
                
                <div className="flex justify-end gap-3 pt-4.5 border-t border-slate-850">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4.5 py-2.5 text-xs font-semibold text-slate-300 bg-slate-855 hover:bg-slate-800 rounded-xl transition-all cursor-pointer">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-5.5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-950/20">
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"></div>
        </>
      )}

      {/* ── Preview Image Modal ── */}
      {previewImage && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
            <div className="bg-slate-900 border border-slate-855 rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 bg-slate-855 border-b border-slate-800">
                <h3 className="text-white font-bold text-sm">{previewImage.title}</h3>
                <button onClick={() => setPreviewImage(null)} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 flex justify-center bg-slate-950">
                <img src={previewImage.url} alt={previewImage.title} className="max-w-full max-h-64 object-contain rounded-lg" />
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"></div>
        </>
      )}

      <PopupMessage show={popup.show} type={popup.type} message={popup.message} onClose={() => setPopup(prev => ({ ...prev, show: false }))} />

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-855 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-rose-600 to-red-600 p-4.5 flex items-center gap-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <h3 className="text-white font-bold text-base">Delete Assignment</h3>
              </div>
              <div className="p-6 text-center">
                <p className="text-slate-350 text-sm font-medium">Are you sure you want to remove this vehicle mapping?</p>
                <p className="text-slate-500 text-xs mt-1.5">This service category mapping will be deleted.</p>
              </div>
              <div className="flex justify-end gap-3 px-6 pb-5">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteTargetUuid(null); }} className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-855 hover:bg-slate-800 rounded-xl transition-all cursor-pointer">Cancel</button>
                <button onClick={confirmDelete} className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-950/20">Yes, Remove</button>
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"></div>
        </>
      )}
    </div>
  );
}
