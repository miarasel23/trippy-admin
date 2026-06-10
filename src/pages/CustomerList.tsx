import React, { useEffect, useState } from 'react';
import { fetchCustomerList, newwork_image_url } from '../utilities/api';
import type { CustomerUserItem } from '../utilities/api';
import { useTranslation } from '../utilities/translation';
import noImage from '../assets/no-image.png';

export default function CustomerList() {
  const t = useTranslation();
  const [customers, setCustomers] = useState<CustomerUserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Details Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUserItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      let data: CustomerUserItem[] = [];
      try {
        data = await fetchCustomerList();
      } catch (err: any) {
        if (err.response?.status === 404 || err.message?.includes('404')) {
          data = [];
        } else {
          throw err;
        }
      }
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Error loading customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewDetails = (customer: CustomerUserItem) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    const fullName = (c.full_name || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const phone = (c.phone_number || '').toLowerCase();
    const nid = (c.nid_number || '').toLowerCase();
    const roleName = (c.role?.name || '').toLowerCase();

    return fullName.includes(q) || email.includes(q) || phone.includes(q) || nid.includes(q) || roleName.includes(q);
  });

  return (
    <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-lg font-bold text-white">{t('customerList')}</h2>
          <div className="relative">
            <input
              type="text"
              className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-64 transition-colors"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          <svg
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
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
                <th className="px-4 py-3 w-14 text-center">SL</th>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone Number</th>
                <th className="px-4 py-3">NID Number</th>
                <th className="px-4 py-3 text-center">Notification</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                    No data found
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                    No customers match the search query.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((item, index) => {
                  const avatarUrl = item.profile_picture
                    ? item.profile_picture.startsWith('http')
                      ? item.profile_picture
                      : `${newwork_image_url}${item.profile_picture}`
                    : noImage;

                  return (
                    <tr key={item.uuid} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400 font-mono">{index + 1}</td>
                      <td className="px-4 py-3">
                        <img
                          src={avatarUrl}
                          alt={item.full_name || 'Customer'}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-700 cursor-pointer hover:ring-indigo-500 transition-all"
                          onClick={() => setPreviewImage({ url: avatarUrl, title: item.full_name || 'Customer' })}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = noImage;
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200">
                        {item.full_name || <span className="text-slate-500 italic">N/A</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {item.email || <span className="text-slate-500 italic">N/A</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono">
                        {item.country_code} {item.phone_number}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono">
                        {item.nid_number || <span className="text-slate-500 italic">N/A</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.is_notification_enabled ? (
                          <span className="px-2.5 py-1 bg-emerald-900/50 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-700/50">
                            Enabled
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-800 text-slate-500 rounded-full text-xs font-semibold border border-slate-700">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 bg-indigo-900/50 text-indigo-300 rounded-md text-xs font-semibold border border-indigo-700/50">
                          {item.role?.name || 'Customer'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.is_active ? (
                          <span className="px-2.5 py-1 bg-emerald-900/50 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-700/50">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-semibold border border-slate-700">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors cursor-pointer mx-auto"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-8">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl">
                <h3 className="text-lg font-semibold text-white">Customer Profile Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-slate-800 pb-6">
                  <img
                    src={
                      selectedCustomer.profile_picture
                        ? selectedCustomer.profile_picture.startsWith('http')
                          ? selectedCustomer.profile_picture
                          : `${newwork_image_url}${selectedCustomer.profile_picture}`
                        : noImage
                    }
                    alt={selectedCustomer.full_name || 'Customer'}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-700 cursor-pointer hover:ring-indigo-500 transition-all"
                    onClick={() => {
                      const url = selectedCustomer.profile_picture
                        ? selectedCustomer.profile_picture.startsWith('http')
                          ? selectedCustomer.profile_picture
                          : `${newwork_image_url}${selectedCustomer.profile_picture}`
                        : noImage;
                      setPreviewImage({ url, title: selectedCustomer.full_name || 'Customer' });
                    }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = noImage;
                    }}
                  />
                  <div className="text-center sm:text-left">
                    <h4 className="text-xl font-bold text-white">
                      {selectedCustomer.full_name || <span className="text-slate-500 italic">No Name Provided</span>}
                    </h4>
                    <p className="text-slate-400 text-sm mt-0.5">{selectedCustomer.email || 'No email registered'}</p>
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                      <span className="px-2.5 py-0.5 bg-indigo-900/50 text-indigo-300 rounded-full text-xs font-semibold border border-indigo-700/50">
                        {selectedCustomer.role?.name || 'Customer'}
                      </span>
                      {selectedCustomer.is_active ? (
                        <span className="px-2.5 py-0.5 bg-emerald-900/50 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-700/50">
                          Active Account
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-slate-800 text-slate-500 rounded-full text-xs font-semibold border border-slate-700">
                          Inactive Account
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Information Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">UUID</span>
                    <span className="block text-slate-300 text-sm font-mono mt-0.5 break-all">{selectedCustomer.uuid}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</span>
                    <span className="block text-slate-300 text-sm font-mono mt-0.5">
                      {selectedCustomer.country_code} {selectedCustomer.phone_number}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">NID Number</span>
                    <span className="block text-slate-300 text-sm font-mono mt-0.5">
                      {selectedCustomer.nid_number || <span className="text-slate-500 italic">N/A</span>}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Notification Device Token</span>
                    <span className="block text-slate-300 text-sm font-mono mt-0.5 break-all">
                      {selectedCustomer.device_token_for_notification || <span className="text-slate-500 italic">None</span>}
                    </span>
                  </div>
                </div>

                {/* Permissions Section */}
                <div className="border-t border-slate-800 pt-6">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Assigned Permissions</span>
                  {selectedCustomer.permissions && selectedCustomer.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2">
                      {selectedCustomer.permissions.map((perm) => (
                        <span
                          key={perm.uuid}
                          className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs border border-slate-700/60"
                          title={perm.code}
                        >
                          {perm.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-sm italic">No custom permissions assigned.</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/40 rounded-b-2xl">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-5 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"></div>
        </>
      )}

      {/* Preview Image Modal */}
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
                <img src={previewImage.url} alt={previewImage.title} className="max-w-full max-h-96 object-contain" />
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"></div>
        </>
      )}
    </div>
  );
}
