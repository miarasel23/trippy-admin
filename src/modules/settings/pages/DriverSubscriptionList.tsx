import React, { useEffect, useState, useMemo } from 'react';
import {
  fetchDriverSubscriptionList,
  fetchCarCategoryList,
  createOrUpdateDriverSubscription,
  type DriverSubscriptionItem,
  type CarCategoryItem,
  type GroupedDriverSubscriptionResponse,
} from '../services/settingsApi';
import { newwork_image_url } from '../../../shared/utils/constants';
import noImage from '../../../shared/assets/images/no-image.png';
import { useTranslation } from '../../../shared/utils/translation';
import { PopupMessage } from '../../../shared/components/PopupMessage';

// Reusable Tailwind style constants
const inputCls =
  'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm';
const labelCls = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1';
const selectCls =
  'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm';

export default function DriverSubscriptionList() {
  const t = useTranslation();

  // Grouped Subscriptions State
  const [groupedSubscriptions, setGroupedSubscriptions] =
    useState<GroupedDriverSubscriptionResponse>({});
  const [carCategories, setCarCategories] = useState<CarCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<DriverSubscriptionItem | null>(null);
  const [subscriptionType, setSubscriptionType] = useState<string>('BASIC');
  const [price, setPrice] = useState<string>('');
  const [previousPrice, setPreviousPrice] = useState<string>('');
  const [validateFor, setValidateFor] = useState<string>('15');
  const [selectedCategoryUuid, setSelectedCategoryUuid] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [flagOne, setFlagOne] = useState<string>('1');
  const [flagTwo, setFlagTwo] = useState<string>('2');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [popup, setPopup] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'error', message: '' });

  // Load Data from API
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [groupedData, categoriesData] = await Promise.all([
        fetchDriverSubscriptionList(),
        fetchCarCategoryList(),
      ]);
      setGroupedSubscriptions(groupedData || {});
      setCarCategories(categoriesData || []);
    } catch (err: any) {
      setError(err.message || 'Error loading driver subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter grouped subscriptions by search query
  const filteredGroupedSubscriptions = useMemo(() => {
    if (!searchQuery.trim()) return groupedSubscriptions;
    const q = searchQuery.toLowerCase();
    const result: GroupedDriverSubscriptionResponse = {};

    Object.entries(groupedSubscriptions).forEach(([categoryName, items]) => {
      const categoryMatches = categoryName.toLowerCase().includes(q);
      const matchingItems = (items || []).filter((sub) => {
        return (
          categoryMatches ||
          sub.subscription_type.toLowerCase().includes(q) ||
          sub.status.toLowerCase().includes(q) ||
          sub.uuid.toLowerCase().includes(q) ||
          sub.price.toString().includes(q) ||
          (sub.validate_for && sub.validate_for.toString().includes(q))
        );
      });

      if (matchingItems.length > 0) {
        result[categoryName] = matchingItems;
      }
    });

    return result;
  }, [groupedSubscriptions, searchQuery]);

  // Aggregate statistics
  const totalCategories = Object.keys(groupedSubscriptions).length;
  const totalPackages = useMemo(() => {
    return Object.values(groupedSubscriptions).reduce(
      (acc, list) => acc + (list?.length || 0),
      0
    );
  }, [groupedSubscriptions]);

  const filteredCategoriesCount = Object.keys(filteredGroupedSubscriptions).length;
  const filteredPackagesCount = useMemo(() => {
    return Object.values(filteredGroupedSubscriptions).reduce(
      (acc, list) => acc + (list?.length || 0),
      0
    );
  }, [filteredGroupedSubscriptions]);

  // Toggle Collapse for a single category
  const toggleCollapse = (categoryName: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  // Toggle Collapse / Expand All
  const areAllCollapsed = useMemo(() => {
    const keys = Object.keys(filteredGroupedSubscriptions);
    if (keys.length === 0) return false;
    return keys.every((key) => collapsedCategories[key]);
  }, [filteredGroupedSubscriptions, collapsedCategories]);

  const toggleAllCollapse = () => {
    const newState = !areAllCollapsed;
    const updated: Record<string, boolean> = {};
    Object.keys(filteredGroupedSubscriptions).forEach((key) => {
      updated[key] = newState;
    });
    setCollapsedCategories(updated);
  };

  // Open Edit Modal
  const handleEditClick = (item: DriverSubscriptionItem) => {
    setEditItem(item);
    setSubscriptionType(item.subscription_type);
    setPrice(item.price.toString());
    setPreviousPrice(item.previous_price.toString());
    setValidateFor(item.validate_for.toString());
    setStatus(item.status);
    setFlagOne(item.flag_one ? item.flag_one.toString() : '1');
    setFlagTwo(item.flag_two ? item.flag_two.toString() : '2');

    // Find category UUID
    const matchedCategory = carCategories.find(
      (c) => c.uuid === item.car_categories_uuid || c.car_type === item.car_type
    );
    setSelectedCategoryUuid(
      item.car_categories_uuid || matchedCategory?.uuid || carCategories[0]?.uuid || ''
    );

    setFormError(null);
    setShowModal(true);
  };

  // Open Add Modal
  const handleAddClick = (defaultCategoryUuid?: string) => {
    setEditItem(null);
    setSubscriptionType('REGISTRATION_PACKAGE');
    setPrice('');
    setPreviousPrice('');
    setValidateFor('15');
    setStatus('ACTIVE');
    setFlagOne('1');
    setFlagTwo('2');

    if (defaultCategoryUuid) {
      setSelectedCategoryUuid(defaultCategoryUuid);
    } else if (carCategories.length > 0) {
      setSelectedCategoryUuid(carCategories[0].uuid);
    } else {
      setSelectedCategoryUuid('');
    }

    setFormError(null);
    setShowModal(true);
  };

  // Handle Modal Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriptionType.trim()) {
      setFormError('Subscription Type is required');
      return;
    }
    if (!price || isNaN(Number(price))) {
      setFormError('Valid Price is required');
      return;
    }
    if (!previousPrice || isNaN(Number(previousPrice))) {
      setFormError('Valid Previous Price is required');
      return;
    }
    if (!validateFor || isNaN(Number(validateFor))) {
      setFormError('Valid Validate For (Days) is required');
      return;
    }
    if (!selectedCategoryUuid) {
      setFormError('Please select a Car Category');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const msg = await createOrUpdateDriverSubscription({
        subscription_type: subscriptionType.trim(),
        price: Number(price),
        previous_price: Number(previousPrice),
        validate_for: Number(validateFor),
        car_categories_uuid: selectedCategoryUuid,
        status,
        flag_one: Number(flagOne),
        flag_two: Number(flagTwo),
        ...(editItem ? { uuid: editItem.uuid } : {}),
      });

      setShowModal(false);
      await loadData();
      setPopup({ show: true, type: 'success', message: msg });
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Error saving subscription.');
    } finally {
      setSubmitting(false);
    }
  };

  // Style badge helper for Subscription Type
  const getSubscriptionTypeBadge = (type: string) => {
    switch (type) {
      case 'REGISTRATION_PACKAGE':
        return 'bg-purple-950/70 text-purple-300 border-purple-800/60';
      case 'BASIC':
        return 'bg-sky-950/70 text-sky-300 border-sky-800/60';
      case 'STANDARD':
        return 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60';
      case 'SAVING':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60';
      case 'SUPER_SAVING':
        return 'bg-amber-950/70 text-amber-300 border-amber-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Toolbar */}
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
          {/* Title & Stats */}
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-base shadow-sm">
                  <i className="fa fa-id-card-o"></i>
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    {t('driverSubscription')} Packages
                  </h2>
                  <p className="text-xs text-slate-400">
                    Grouped by vehicle category with pricing, flags & validity
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stat Pills */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-950/60 border border-indigo-800/60 rounded-lg text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                <i className="fa fa-car text-[10px]"></i>
                <span>
                  {searchQuery ? `${filteredCategoriesCount}/` : ''}
                  {totalCategories} Categories
                </span>
              </span>
              <span className="px-3 py-1 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <i className="fa fa-cubes text-[10px]"></i>
                <span>
                  {searchQuery ? `${filteredPackagesCount}/` : ''}
                  {totalPackages} Packages
                </span>
              </span>
            </div>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                className="pl-9 pr-8 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs w-60 transition-colors"
                placeholder="Search package, price, status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg
                className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"
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
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Collapse/Expand All Button */}
            {filteredCategoriesCount > 0 && (
              <button
                onClick={toggleAllCollapse}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700/80 transition-colors cursor-pointer"
                title={areAllCollapsed ? 'Expand all categories' : 'Collapse all categories'}
              >
                <i className={`fa fa-${areAllCollapsed ? 'expand' : 'compress'} text-[11px]`}></i>
                <span>{areAllCollapsed ? 'Expand All' : 'Collapse All'}</span>
              </button>
            )}

            {/* Add Subscription Button */}
            <button
              onClick={() => handleAddClick()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-950/50"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Add Subscription</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white text-xs font-medium rounded-xl border border-slate-700/80 transition-colors cursor-pointer"
              title="Refresh list"
            >
              <svg
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`}
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
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-16 flex flex-col items-center justify-center gap-3 text-slate-400 shadow-xl">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-medium">Loading driver subscriptions...</p>
        </div>
      )}

      {/* Error Banner */}
      {error && !loading && (
        <div className="p-4 bg-rose-950/40 border border-rose-700/80 text-rose-300 rounded-2xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa fa-exclamation-triangle"></i>
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-rose-800/50 hover:bg-rose-700 text-rose-200 text-xs font-semibold rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {/* Grouped Subscriptions View */}
      {!loading && !error && (
        <>
          {filteredCategoriesCount === 0 ? (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-16 text-center shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-500 flex items-center justify-center mx-auto mb-4 text-2xl">
                <i className="fa fa-car"></i>
              </div>
              <h3 className="text-base font-bold text-slate-200">No driver subscriptions found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `No subscriptions match "${searchQuery}". Try clearing the search.`
                  : 'Get started by creating your first driver subscription package.'}
              </p>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Clear Search
                </button>
              ) : (
                <button
                  onClick={() => handleAddClick()}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
                >
                  + Add First Subscription
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(filteredGroupedSubscriptions).map(([categoryName, items]) => {
                const isCollapsed = Boolean(collapsedCategories[categoryName]);
                const firstItem = items[0];

                // Resolve category avatar
                const matchedCategory = carCategories.find(
                  (c) =>
                    c.car_type === categoryName ||
                    (firstItem?.car_categories_uuid && c.uuid === firstItem.car_categories_uuid)
                );

                const rawAvatar = firstItem?.car_avatar || matchedCategory?.car_avatar;
                const avatarUrl = rawAvatar
                  ? rawAvatar.startsWith('http')
                    ? rawAvatar
                    : `${newwork_image_url}${rawAvatar}`
                  : noImage;

                const categoryUuid =
                  firstItem?.car_categories_uuid || matchedCategory?.uuid || '';

                const activeCount = items.filter((i) => i.status === 'ACTIVE').length;
                const inactiveCount = items.length - activeCount;

                return (
                  <div
                    key={categoryName}
                    className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800/90 overflow-hidden transition-all duration-200"
                  >
                    {/* Category Header Bar */}
                    <div className="bg-slate-950/80 px-5 py-3.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                      {/* Left: Avatar + Title + Stats */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={avatarUrl}
                            alt={categoryName}
                            className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-800 bg-slate-900 cursor-pointer hover:ring-indigo-500 transition shadow"
                            onClick={() =>
                              setPreviewImage({ url: avatarUrl, title: categoryName })
                            }
                            title="Click to preview image"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-black text-white tracking-wide">
                              {categoryName.replace(/_/g, ' ')}
                            </h3>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                              {items.length} {items.length === 1 ? 'Package' : 'Packages'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1 text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                              <span>{activeCount} Active</span>
                            </span>
                            {inactiveCount > 0 && (
                              <span className="flex items-center gap-1 text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block"></span>
                                <span>{inactiveCount} Inactive</span>
                              </span>
                            )}
                            {categoryUuid && (
                              <span className="text-slate-400 font-mono text-[10px] hidden md:inline truncate max-w-[180px]">
                                UUID: {categoryUuid}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Add to Category + Collapse Toggle */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAddClick(categoryUuid)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold rounded-lg border border-indigo-500/30 hover:border-transparent transition-all cursor-pointer shadow-sm"
                          title={`Add new package for ${categoryName}`}
                        >
                          <i className="fa fa-plus text-[10px]"></i>
                          <span>Add to {categoryName.replace(/_/g, ' ')}</span>
                        </button>
                        <button
                          onClick={() => toggleCollapse(categoryName)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title={isCollapsed ? 'Expand category' : 'Collapse category'}
                        >
                          <i
                            className={`fa fa-chevron-${
                              isCollapsed ? 'down' : 'up'
                            } text-xs transition-transform`}
                          ></i>
                        </button>
                      </div>
                    </div>

                    {/* Table of Subscriptions in this Category */}
                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="bg-slate-800/40 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800/60">
                              <th className="px-4 py-3 w-12 text-center">SL</th>
                              <th className="px-4 py-3">Package Type</th>
                              <th className="px-4 py-3">Price</th>
                              <th className="px-4 py-3">Previous Price</th>
                              <th className="px-4 py-3">Validity</th>
                              <th className="px-4 py-3">Flags</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">UUID</th>
                              <th className="px-4 py-3">Created</th>
                              <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {items.map((item, index) => {
                              const discount =
                                item.previous_price > item.price
                                  ? item.previous_price - item.price
                                  : 0;
                              const discountPercent =
                                item.previous_price > 0 && discount > 0
                                  ? Math.round((discount / item.previous_price) * 100)
                                  : 0;

                              return (
                                <tr
                                  key={item.uuid}
                                  className="hover:bg-slate-800/30 transition-colors group"
                                >
                                  {/* SL */}
                                  <td className="px-4 py-3.5 text-center text-slate-400 font-mono text-xs">
                                    {index + 1}
                                  </td>

                                  {/* Package Type */}
                                  <td className="px-4 py-3.5">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${getSubscriptionTypeBadge(
                                        item.subscription_type
                                      )}`}
                                    >
                                      <i className="fa fa-tag text-[9px]"></i>
                                      <span>{item.subscription_type.replace(/_/g, ' ')}</span>
                                    </span>
                                  </td>

                                  {/* Price */}
                                  <td className="px-4 py-3.5">
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-base font-black text-emerald-400">
                                        ৳{item.price.toFixed(2)}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Previous Price & Discount */}
                                  <td className="px-4 py-3.5">
                                    <div className="flex flex-col">
                                      <span className="text-xs text-slate-400 line-through font-medium">
                                        ৳{item.previous_price.toFixed(2)}
                                      </span>
                                      {discount > 0 && (
                                        <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                                          <span>Save ৳{discount.toFixed(0)}</span>
                                          <span>({discountPercent}% OFF)</span>
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Validity */}
                                  <td className="px-4 py-3.5">
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-semibold">
                                      <i className="fa fa-calendar-o text-[10px] text-slate-400"></i>
                                      <span>{item.validate_for} days</span>
                                    </div>
                                  </td>

                                  {/* Flags */}
                                  <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 border border-slate-700 text-slate-300"
                                        title="Flag One"
                                      >
                                        F1: {item.flag_one ?? '1'}
                                      </span>
                                      <span
                                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 border border-slate-700 text-slate-300"
                                        title="Flag Two"
                                      >
                                        F2: {item.flag_two ?? '2'}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Status */}
                                  <td className="px-4 py-3.5">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                        item.status === 'ACTIVE'
                                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
                                          : 'bg-rose-950/70 text-rose-300 border-rose-800/60'
                                      }`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          item.status === 'ACTIVE'
                                            ? 'bg-emerald-400'
                                            : 'bg-rose-400'
                                        }`}
                                      ></span>
                                      <span>{item.status}</span>
                                    </span>
                                  </td>

                                  {/* UUID */}
                                  <td className="px-4 py-3.5">
                                    <span
                                      className="text-xs font-mono text-slate-400 truncate max-w-[120px] block"
                                      title={item.uuid}
                                    >
                                      {item.uuid}
                                    </span>
                                  </td>

                                  {/* Created */}
                                  <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                                    {item.created_at
                                      ? new Date(item.created_at).toLocaleDateString()
                                      : 'N/A'}
                                  </td>

                                  {/* Actions */}
                                  <td className="px-4 py-3.5 text-right">
                                    <button
                                      onClick={() => handleEditClick(item)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 hover:border-indigo-500 transition-all cursor-pointer shadow-xs"
                                    >
                                      <i className="fa fa-pencil text-[10px]"></i>
                                      <span>Edit</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl my-8 overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold text-sm">
                    <i className="fa fa-id-card"></i>
                  </div>
                  <div>
                    <h3 className="text-base font-bold">
                      {editItem ? 'Edit Driver Subscription' : 'Add Driver Subscription'}
                    </h3>
                    <p className="text-xs text-indigo-200">
                      {editItem
                        ? 'Update pricing, validity or configuration'
                        : 'Configure a new package for a vehicle category'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {formError && (
                  <div className="px-3.5 py-2.5 bg-rose-950/50 border border-rose-700/80 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                    <i className="fa fa-exclamation-circle text-sm shrink-0"></i>
                    <span>{formError}</span>
                  </div>
                )}

                {/* Car Category & Subscription Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Car Category *</label>
                    <select
                      className={selectCls}
                      value={selectedCategoryUuid}
                      onChange={(e) => setSelectedCategoryUuid(e.target.value)}
                      required
                    >
                      <option value="">Select Category</option>
                      {carCategories.map((cat) => (
                        <option key={cat.uuid} value={cat.uuid}>
                          {cat.car_type.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>Subscription Type *</label>
                    <select
                      className={selectCls}
                      value={subscriptionType}
                      onChange={(e) => setSubscriptionType(e.target.value)}
                      required
                    >
                      {[
                        'REGISTRATION_PACKAGE',
                        'BASIC',
                        'STANDARD',
                        'SAVING',
                        'SUPER_SAVING',
                      ].map((v) => (
                        <option key={v} value={v}>
                          {v.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pricing: Price & Previous Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Price (৳) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                        ৳
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        className={`${inputCls} pl-7`}
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Previous Price (৳) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                        ৳
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        className={`${inputCls} pl-7`}
                        placeholder="0.00"
                        value={previousPrice}
                        onChange={(e) => setPreviousPrice(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Validate For & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Validity (Days) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        className={inputCls}
                        placeholder="e.g. 15, 30"
                        value={validateFor}
                        onChange={(e) => setValidateFor(e.target.value)}
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                        days
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Status *</label>
                    <select
                      className={selectCls}
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      required
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                {/* Flags (Flag One & Flag Two) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Flag One *</label>
                    <select
                      className={selectCls}
                      value={flagOne}
                      onChange={(e) => setFlagOne(e.target.value)}
                      required
                    >
                      {Array.from({ length: 50 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Flag Two *</label>
                    <select
                      className={selectCls}
                      value={flagTwo}
                      onChange={(e) => setFlagTwo(e.target.value)}
                      required
                    >
                      {Array.from({ length: 50 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-900/50"
                  >
                    {submitting ? 'Saving...' : editItem ? 'Update Package' : 'Create Package'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs"
            onClick={() => setShowModal(false)}
          ></div>
        </>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-white font-bold text-sm">
                {previewImage.title.replace(/_/g, ' ')}
              </h4>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex justify-center">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      <PopupMessage
        show={popup.show}
        type={popup.type}
        message={popup.message}
        onClose={() => setPopup((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}
