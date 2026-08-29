import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchRiderList } from '../services/riderApi';
import type { RiderItem } from '../services/types';
import { newwork_image_url } from '../../../shared/utils/constants';
import { PopupMessage } from '../../../shared/components/PopupMessage';
import noImage from '../../../shared/assets/images/no-image.png';
import RiderEditForm from '../components/RiderEditForm';
import RiderViewModal from '../components/RiderViewModal';

export default function RiderList() {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('search') || searchParams.get('phone') || searchParams.get('uuid') || '';
  const [riders, setRiders] = useState<RiderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(urlQuery);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<RiderItem | null>(null);
  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });

  // View Modal State
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [viewItem, setViewItem] = useState<RiderItem | null>(null);

  const handleEditClick = (item: RiderItem) => {
    setActiveDropdown(null);
    setEditItem(item);
    setShowEditModal(true);
  };

  const handleViewClick = (item: RiderItem) => {
    setActiveDropdown(null);
    setViewItem(item);
    setShowViewModal(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRiderList();
      setRiders(data);
    } catch (err: any) {
      setError(err.message || 'Error loading rider list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('phone') || searchParams.get('uuid') || '';
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const filteredRiders = riders.filter((rider) => {
    const q = searchQuery.toLowerCase();
    return (
      (rider.full_name?.toLowerCase().includes(q) || false) ||
      rider.phone_number.toLowerCase().includes(q) ||
      (rider.email?.toLowerCase().includes(q) || false) ||
      rider.uuid.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-lg font-bold text-white">Rider List</h2>
          <div className="relative">
            <input
              type="text"
              className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-64 transition-colors"
              placeholder="Search by name, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-x-auto min-h-[400px]">
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        )}
        {error && (
          <div className="m-4 px-4 py-3 bg-rose-900/40 border border-rose-700 text-rose-300 rounded-lg text-sm">
            {error}
          </div>
        )}
        {!loading && !error && (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-800/60 text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3 w-16">SL</th>
                <th className="px-4 py-3">Profile</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Country Code</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRiders.map((item, index) => {
                const avatarUrl = item.profile_picture
                  ? (item.profile_picture.startsWith('http') ? item.profile_picture : `${newwork_image_url}${item.profile_picture}`)
                  : noImage;
                return (
                  <tr key={item.uuid} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono">{index + 1}</td>
                    <td className="px-4 py-3">
                      <img
                        src={avatarUrl}
                        alt={item.full_name || 'Rider'}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = noImage; }}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-medium">{item.full_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-300">{item.country_code || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-300">{item.phone_number}</td>
                    <td className="px-4 py-3 text-slate-400">{item.email || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.is_active === 'ACTIVE'
                        ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                        : 'bg-rose-900/50 text-rose-300 border border-rose-700/50'
                        }`}>
                        {item.is_active || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === item.uuid ? null : item.uuid)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <i className="fa fa-ellipsis-v px-1"></i>
                        </button>

                        {activeDropdown === item.uuid && (
                              <div className="absolute right-0 mt-2 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 py-1">
                            <button
                              onClick={() => handleViewClick(item)}
                              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <i className="fa fa-eye w-4"></i> View
                            </button>
                            <button
                              onClick={() => handleEditClick(item)}
                              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <i className="fa fa-pencil w-4"></i> Edit
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2"
                              onClick={() => { setActiveDropdown(null); /* handle transaction */ }}
                            >
                              <i className="fa fa-exchange-alt w-4 text-center"></i> Transaction
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRiders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No riders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <RiderEditForm 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        editItem={editItem} 
        onSuccess={(msg) => { 
          setShowEditModal(false); 
          setPopup({ show: true, type: 'success', message: msg }); 
          loadData(); 
        }} 
      />

      {showViewModal && (
        <RiderViewModal 
          item={viewItem} 
          onClose={() => setShowViewModal(false)} 
        />
      )}

      <PopupMessage show={popup.show} type={popup.type} message={popup.message} onClose={() => setPopup(prev => ({ ...prev, show: false }))} />

    </div>
  );
}
