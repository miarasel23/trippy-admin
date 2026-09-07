import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  fetchPrivacyPolicyList,
  createPrivacyPolicyItem,
  updatePrivacyPolicyItem,
  deletePrivacyPolicyItem,
  type PrivacyPolicyItem,
  type PrivacyPolicyGroupedResponse,
  type PolicyType,
} from '../services/privacyPolicyApi';
import { AuthContextTrippy } from '../../../shared/hooks/useAuth';
import { HtmlEditor } from '../components/HtmlEditor';

const POLICY_TYPES = [
  { key: 'TERMS_CONDITION', label: 'Terms & Conditions', icon: 'fa-file-text-o', color: 'indigo' },
  { key: 'PRIVACY_POLICY', label: 'Privacy Policy', icon: 'fa-shield', color: 'blue' },
  { key: 'TRIP_POLICY', label: 'Trip Policy', icon: 'fa-car', color: 'emerald' },
  { key: 'HELP_AND_SUPPORT', label: 'Help & Support', icon: 'fa-phone', color: 'amber' },
];

export const PrivacyPolicyList: React.FC = () => {
  const auth = useContext(AuthContextTrippy);
  const [groupedData, setGroupedData] = useState<PrivacyPolicyGroupedResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [countryCode, setCountryCode] = useState('BD');
  const [selectedTab, setSelectedTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<PrivacyPolicyItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    type: 'TERMS_CONDITION' as PolicyType,
    country_code: 'BD',
    status: 'ACTIVE',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Preview modal
  const [previewItem, setPreviewItem] = useState<PrivacyPolicyItem | null>(null);

  // Delete modal
  const [itemToDelete, setItemToDelete] = useState<PrivacyPolicyItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPrivacyPolicyList(countryCode, auth?.language);
      setGroupedData(data);
    } catch (err: any) {
      console.error('Failed to load privacy policy items:', err);
      setError(err.message || 'Failed to load policy list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [countryCode, auth?.language]);

  // Flattened all items list
  const allItems: PrivacyPolicyItem[] = useMemo(() => {
    const list: PrivacyPolicyItem[] = [];
    Object.keys(groupedData).forEach((key) => {
      const items = groupedData[key];
      if (Array.isArray(items)) {
        list.push(...items);
      }
    });
    return list;
  }, [groupedData]);

  // Filtered items based on active tab and search query
  const filteredItems = useMemo(() => {
    let items = allItems;
    if (selectedTab !== 'ALL') {
      items = items.filter((item) => item.type === selectedTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.type.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          item.uuid.toLowerCase().includes(q)
      );
    }
    return items;
  }, [allItems, selectedTab, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsEditMode(false);
    setEditingItem(null);
    setFormData({
      type: selectedTab !== 'ALL' ? (selectedTab as PolicyType) : 'TERMS_CONDITION',
      country_code: countryCode,
      status: 'ACTIVE',
      content: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: PrivacyPolicyItem) => {
    setIsEditMode(true);
    setEditingItem(item);
    setFormData({
      type: item.type || 'TERMS_CONDITION',
      country_code: (item.country_code || countryCode || 'BD').toUpperCase(),
      status: (item.status || 'ACTIVE').toUpperCase(),
      content: item.content || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Create / Edit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      setFormError('Policy content is required');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      if (isEditMode && editingItem) {
        await updatePrivacyPolicyItem({
          uuid: editingItem.uuid,
          type: formData.type,
          content: formData.content,
          country_code: formData.country_code,
          status: formData.status,
        });
      } else {
        await createPrivacyPolicyItem({
          type: formData.type,
          content: formData.content,
          country_code: formData.country_code,
          status: formData.status,
        });
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Failed to save item:', err);
      setFormError(err.message || 'Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deletePrivacyPolicyItem(itemToDelete.uuid);
      setItemToDelete(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to delete item:', err);
      alert(err.message || 'Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'TERMS_CONDITION':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'PRIVACY_POLICY':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'TRIP_POLICY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'HELP_AND_SUPPORT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const cleanTextPreview = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-xs">
            <i className="fa fa-shield"></i>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-950 tracking-tight">
              Privacy Policy & Terms Conditions
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage platform agreements, policies, terms of service, and support channels
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Country selector */}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700">
            <i className="fa fa-globe text-gray-400"></i>
            <span className="text-gray-500">Country:</span>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="BD">Bangladesh (BD)</option>
              <option value="US">United States (US)</option>
              <option value="GB">United Kingdom (GB)</option>
              <option value="IN">India (IN)</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={loadData}
            title="Refresh policies"
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 transition"
          >
            <i className={`fa fa-refresh text-xs ${loading ? 'fa-spin text-blue-600' : ''}`}></i>
          </button>

          {/* Add New Button */}
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer"
          >
            <i className="fa fa-plus"></i>
            <span>Add Policy / Terms</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <button
              onClick={() => setSelectedTab('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                selectedTab === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>All Items</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  selectedTab === 'ALL' ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {allItems.length}
              </span>
            </button>

            {POLICY_TYPES.map((tab) => {
              const count = (groupedData[tab.key] || []).length;
              const isSelected = selectedTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <i className={`fa ${tab.icon} text-[11px]`}></i>
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <i className="fa fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            <input
              type="text"
              placeholder="Search content or UUID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-200/80 flex flex-col items-center justify-center gap-3 text-gray-400">
          <i className="fa fa-circle-o-notch fa-spin text-3xl text-blue-600"></i>
          <span className="text-xs font-medium">Loading policies & terms...</span>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center text-rose-700 space-y-3">
          <i className="fa fa-exclamation-triangle text-3xl text-rose-500"></i>
          <p className="text-xs font-semibold">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-200/80 flex flex-col items-center justify-center text-center text-gray-400">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl text-gray-400 mb-3">
            <i className="fa fa-file-text-o"></i>
          </div>
          <h3 className="text-sm font-bold text-gray-800">No Policy Items Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            {searchQuery
              ? 'No items match your search query.'
              : 'There are currently no items in this category. Click "+ Add Policy / Terms" to create one.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            Create New Item
          </button>
        </div>
      ) : (
        /* Items Grid / Cards */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const previewSnippet = cleanTextPreview(item.content);
            const isTerms = item.type === 'TERMS_CONDITION';
            const isPrivacy = item.type === 'PRIVACY_POLICY';
            const isTrip = item.type === 'TRIP_POLICY';
            const isSupport = item.type === 'HELP_AND_SUPPORT';

            return (
              <div
                key={item.uuid}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200/80 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Top Row */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${getBadgeStyle(
                          item.type
                        )}`}
                      >
                        {isTerms
                          ? 'Terms & Conditions'
                          : isPrivacy
                          ? 'Privacy Policy'
                          : isTrip
                          ? 'Trip Policy'
                          : isSupport
                          ? 'Help & Support'
                          : item.type}
                      </span>

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                        {item.country_code}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          item.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        ></span>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* UUID & Dates */}
                  <div className="pt-2 text-[10px] text-gray-400 flex items-center justify-between font-mono">
                    <span className="truncate max-w-[200px]" title={item.uuid}>
                      UUID: {item.uuid}
                    </span>
                    <span>{new Date(item.updated_at || item.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Content Preview */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-700 leading-relaxed max-h-36 overflow-y-auto custom-scrollbar">
                    {previewSnippet ? (
                      <p className="line-clamp-4">{previewSnippet}</p>
                    ) : (
                      <span className="text-gray-400 italic">No text content available</span>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa fa-eye"></i>
                    <span>Full Preview</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    >
                      <i className="fa fa-pencil text-[10px]"></i>
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setItemToDelete(item)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    >
                      <i className="fa fa-trash text-[10px]"></i>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                  <i className={isEditMode ? 'fa fa-pencil' : 'fa fa-plus'}></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {isEditMode ? 'Edit Policy / Terms' : 'Create New Policy / Terms'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {isEditMode ? `UUID: ${editingItem?.uuid}` : 'Add legal terms or policy content'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm p-1.5 rounded-lg hover:bg-gray-200 transition"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {formError}
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Policy Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PolicyType })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TERMS_CONDITION">TERMS_CONDITION (Terms & Conditions)</option>
                    <option value="PRIVACY_POLICY">PRIVACY_POLICY (Privacy Policy)</option>
                    <option value="TRIP_POLICY">TRIP_POLICY (Trip Policy)</option>
                    <option value="HELP_AND_SUPPORT">HELP_AND_SUPPORT (Help & Support)</option>
                  </select>
                </div>

                {/* Country Code */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Country Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BD"
                    value={formData.country_code}
                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Content Rich HTML Editor */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Policy Content (WYSIWYG HTML Editor) <span className="text-rose-500">*</span>
                </label>
                <HtmlEditor
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Type or paste your policy terms here. Use formatting buttons above for bold, headings, lists, links..."
                  minHeight="280px"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : isEditMode ? 'Update Policy' : 'Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PREVIEW MODAL */}
      {previewItem && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase ${getBadgeStyle(
                    previewItem.type
                  )}`}
                >
                  {previewItem.type}
                </span>
                <span className="text-xs text-gray-500 font-mono">Country: {previewItem.country_code}</span>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-gray-400 hover:text-gray-600 text-sm p-1 rounded-md hover:bg-gray-200 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar leading-relaxed text-gray-800 text-xs space-y-3">
              <div dangerouslySetInnerHTML={{ __html: previewItem.content }} />
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl mx-auto">
              <i className="fa fa-trash"></i>
            </div>
            <h3 className="text-sm font-bold text-gray-900">Confirm Deletion</h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to delete this {itemToDelete.type} item? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacyPolicyList;
