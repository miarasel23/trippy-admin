import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCustomerList, updateCustomerProfile, uploadCustomerProfilePicture } from '../services/customerApi';
import { newwork_image_url } from '../../../shared/utils/constants';
import type { CustomerUserItem } from '../services/types';
import { useTranslation } from '../../../shared/utils/translation';
import { PopupMessage } from '../../../shared/components/PopupMessage';
import noImage from '../../../shared/assets/images/no-image.png';
import CustomerDetailsModal from '../components/CustomerDetailsModal';
import CustomerEditModal from '../components/CustomerEditModal';
import ImagePreviewModal from '../components/ImagePreviewModal';


export default function CustomerList() {
  const t = useTranslation();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerUserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Details Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUserItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    uuid: '',
    full_name: '',
    email: '',
    phone_number: '',
    country_code: '',
    is_notification_enabled: false,
    device_token_for_notification: '',
    is_active: true
  });
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (activeDropdown && !target.closest('.action-dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const handleEditCustomer = (customer: CustomerUserItem) => {
    setEditForm({
      uuid: customer.uuid,
      full_name: customer.full_name || '',
      email: customer.email || '',
      phone_number: customer.phone_number || '',
      country_code: customer.country_code || '',
      is_notification_enabled: customer.is_notification_enabled || false,
      device_token_for_notification: customer.device_token_for_notification || '',
      is_active: customer.is_active || false
    });
    const avatarUrl = customer.profile_picture
      ? customer.profile_picture.startsWith('http')
        ? customer.profile_picture
        : `${newwork_image_url}${customer.profile_picture}`
      : noImage;
    setEditAvatarUrl(avatarUrl);
    setFormError(null);
    setShowEditModal(true);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setSubmitting(true);
        setFormError(null);
        const res = await uploadCustomerProfilePicture(editForm.uuid, file);
        const newUrl = res.profile_picture.startsWith('http')
          ? res.profile_picture
          : `${newwork_image_url}${res.profile_picture}`;
        setEditAvatarUrl(newUrl);
        setPopup({ show: true, type: 'success', message: 'Profile picture uploaded successfully' });
        await loadData();
      } catch (err: any) {
        const msg = err?.response?.data?.message || err.message || 'Failed to upload profile picture';
        setFormError(msg);
        setPopup({ show: true, type: 'error', message: msg });
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError(null);
      await updateCustomerProfile({
        uuid: editForm.uuid,
        full_name: editForm.full_name,
        email: editForm.email,
        phone_number: editForm.phone_number,
        country_code: editForm.country_code,
        is_notification_enabled: editForm.is_notification_enabled,
        device_token_for_notification: editForm.device_token_for_notification,
        is_active: editForm.is_active
      });
      setShowEditModal(false);
      await loadData();
      setPopup({ show: true, type: 'success', message: 'Customer profile updated successfully' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to update customer';
      setFormError(msg);
      setPopup({ show: true, type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };


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
                      <td className="px-4 py-3 text-center relative">
                        <div className="action-dropdown-container inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === item.uuid ? null : item.uuid);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer focus:outline-none"
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
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </button>

                          {activeDropdown === item.uuid && (
                            <div className="absolute right-0 mt-1 w-32 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
                              <button
                                onClick={() => {
                                  setActiveDropdown(null);
                                  handleViewDetails(item);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-left font-medium"
                              >
                                <svg
                                  className="w-3.5 h-3.5 text-indigo-400"
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
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setActiveDropdown(null);
                                  handleEditCustomer(item);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-left font-medium"
                              >
                                <svg
                                  className="w-3.5 h-3.5 text-amber-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setActiveDropdown(null);
                                  navigate(`/dashboard/trip?customer_uuid=${item.uuid}`);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-left border-t border-slate-800/60 font-medium"
                              >
                                <svg
                                  className="w-3.5 h-3.5 text-emerald-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L16 4m0 13V4m0 0L9 7"
                                  />
                                </svg>
                                Trip
                              </button>
                            </div>
                          )}
                        </div>
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
      {showDetailsModal && (
        <CustomerDetailsModal
          selectedCustomer={selectedCustomer}
          onClose={() => setShowDetailsModal(false)}
          onPreviewImage={setPreviewImage}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <CustomerEditModal
          editForm={editForm}
          setEditForm={setEditForm}
          editAvatarUrl={editAvatarUrl}
          fileInputRef={fileInputRef}
          handleAvatarFileChange={handleAvatarFileChange}
          formError={formError}
          submitting={submitting}
          onSubmit={handleEditSubmit}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Preview Image Modal */}
      <ImagePreviewModal
        previewImage={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      <PopupMessage
        show={popup.show}
        type={popup.type}
        message={popup.message}
        onClose={() => setPopup((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}

