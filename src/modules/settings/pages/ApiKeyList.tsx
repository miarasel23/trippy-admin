import React, { useEffect, useState, useMemo } from 'react';
import {
  fetchApiKeyList,
  createApiKey,
  updateApiKey,
  deleteApiKey,
} from '../services/apiKeyApi';
import { type ApiKeyItem, SERVICE_IDENTIFIERS } from '../services/types';
import { useTranslation } from '../../../shared/utils/translation';
import { PopupMessage } from '../../../shared/components/PopupMessage';

const inputCls =
  'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm';
const labelCls =
  'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1';
const selectCls =
  'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm';

// Mask helper for API Keys: shows first 6 and last 4 characters
const maskApiKey = (key: string): string => {
  if (!key) return '—';
  if (key.length <= 10) return '••••••••••••';
  return `${key.slice(0, 7)}••••••••••••${key.slice(-4)}`;
};

export default function ApiKeyList() {
  const t = useTranslation();

  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('ALL');

  // Reveal unmasked keys state: set of uuids whose keys are unmasked
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  // Copied indicator tracker: uuid or field key -> timestamp
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<ApiKeyItem | null>(null);
  const [apiUrl, setApiUrl] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [userAgent, setUserAgent] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteTargetUuid, setDeleteTargetUuid] = useState<string | null>(null);

  // Popup Alert
  const [popup, setPopup] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'error', message: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchApiKeyList();
      setApiKeys(data);
    } catch (err: any) {
      setError(err.message || 'Error loading API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleReveal = (uuid: string) => {
    setRevealedKeys((prev) => ({
      ...prev,
      [uuid]: !prev[uuid],
    }));
  };

  const handleCopyToClipboard = (text: string, identifier: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(identifier);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddClick = () => {
    setEditItem(null);
    setApiUrl('');
    setApiKey('');
    setUserAgent(SERVICE_IDENTIFIERS[0]);
    setStatus('ACTIVE');
    setFormError(null);
    setShowModal(true);
  };

  const handleEditClick = (item: ApiKeyItem) => {
    setEditItem(item);
    setApiUrl(item.api_url);
    setApiKey(item.api_key);
    setUserAgent(item.user_agent || '');
    setStatus(item.status || 'ACTIVE');
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditItem(null);
    setApiUrl('');
    setApiKey('');
    setUserAgent('');
    setStatus('ACTIVE');
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiUrl.trim()) {
      setFormError('API URL is required');
      return;
    }
    if (!apiKey.trim()) {
      setFormError('API Key is required');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (editItem) {
        const msg = await updateApiKey({
          uuid: editItem.uuid,
          api_url: apiUrl.trim(),
          api_key: apiKey.trim(),
          user_agent: userAgent.trim() || undefined,
          status,
        });
        handleCloseModal();
        await loadData();
        setPopup({ show: true, type: 'success', message: msg || 'API key updated successfully' });
      } else {
        const msg = await createApiKey({
          api_url: apiUrl.trim(),
          api_key: apiKey.trim(),
          user_agent: userAgent.trim() || undefined,
          status,
        });
        handleCloseModal();
        await loadData();
        setPopup({ show: true, type: 'success', message: msg || 'API key created successfully' });
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Error saving API key';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
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
      const msg = await deleteApiKey(deleteTargetUuid);
      setDeleteTargetUuid(null);
      await loadData();
      setPopup({ show: true, type: 'success', message: msg || 'API key deleted successfully' });
    } catch (err: any) {
      setDeleteTargetUuid(null);
      setPopup({
        show: true,
        type: 'error',
        message:
          err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err?.message ||
          'Failed to delete API key',
      });
      setLoading(false);
    }
  };

  // Filtered keys based on search query and service filter
  const filteredKeys = useMemo(() => {
    let result = apiKeys;

    if (selectedServiceFilter !== 'ALL') {
      result = result.filter((item) => item.user_agent === selectedServiceFilter);
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return result;

    return result.filter((item) => {
      const agent = (item.user_agent || '').toLowerCase();
      const url = (item.api_url || '').toLowerCase();
      const key = (item.api_key || '').toLowerCase();
      const stat = (item.status || '').toLowerCase();
      const uuid = (item.uuid || '').toLowerCase();
      return (
        agent.includes(q) ||
        url.includes(q) ||
        key.includes(q) ||
        stat.includes(q) ||
        uuid.includes(q)
      );
    });
  }, [apiKeys, searchQuery, selectedServiceFilter]);

  // Statistics
  const activeCount = useMemo(
    () => apiKeys.filter((k) => k.status === 'ACTIVE').length,
    [apiKeys]
  );
  const inactiveCount = useMemo(
    () => apiKeys.filter((k) => k.status !== 'ACTIVE').length,
    [apiKeys]
  );

  return (
    <div className="space-y-6">
      {/* ── Top Stat Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total API Keys</p>
            <p className="text-2xl font-black text-white mt-1">{apiKeys.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <i className="fa fa-key text-xl"></i>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Keys</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <i className="fa fa-check-circle text-xl"></i>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Inactive Keys</p>
            <p className="text-2xl font-black text-rose-400 mt-1">{inactiveCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <i className="fa fa-ban text-xl"></i>
          </div>
        </div>
      </div>

      {/* ── Main Table Card ───────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <i className="fa fa-key text-sm"></i>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {t('apiKey')}
              </h2>
            </div>

            <div className="relative">
              <input
                type="text"
                className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-64 sm:w-72 transition-colors"
                placeholder="Search by service, url, key..."
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

            {/* Service filter dropdown */}
            <select
              value={selectedServiceFilter}
              onChange={(e) => setSelectedServiceFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Services</option>
              {SERVICE_IDENTIFIERS.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-sm font-medium rounded-lg transition-colors cursor-pointer border border-slate-700"
              title="Refresh list"
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
              <span>Refresh</span>
            </button>

            <button
              onClick={handleAddClick}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-900/40"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Add API Key</span>
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto min-h-[350px]">
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
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/60 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-4 py-3.5 w-14 text-center">SL</th>
                  <th className="px-4 py-3.5 min-w-[180px]">Service / User Agent</th>
                  <th className="px-4 py-3.5 min-w-[240px]">API Endpoint URL</th>
                  <th className="px-4 py-3.5 min-w-[260px]">API Key / Secret</th>
                  <th className="px-4 py-3.5 text-center w-28">Status</th>
                  <th className="px-4 py-3.5 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredKeys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <i className="fa fa-key text-3xl text-slate-600"></i>
                        <span>No API keys found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredKeys.map((item, index) => {
                    const isRevealed = !!revealedKeys[item.uuid];
                    const isKeyCopied = copiedKey === `key-${item.uuid}`;
                    const isUrlCopied = copiedKey === `url-${item.uuid}`;

                    return (
                      <tr
                        key={item.uuid || item.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        {/* SL */}
                        <td className="px-4 py-3.5 text-center text-slate-400 font-mono text-xs">
                          {index + 1}
                        </td>

                        {/* Service / User Agent */}
                        <td className="px-4 py-3.5">
                          {item.user_agent ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/15 text-indigo-300 rounded-md text-xs font-bold border border-indigo-500/30">
                              <i className="fa fa-tag text-[10px] opacity-70"></i>
                              {item.user_agent}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs italic">
                              Default Service
                            </span>
                          )}
                        </td>

                        {/* API URL */}
                        <td className="px-4 py-3.5 max-w-[280px]">
                          <div className="flex items-center gap-2 group">
                            <span
                              className="font-mono text-xs text-slate-300 truncate"
                              title={item.api_url}
                            >
                              {item.api_url}
                            </span>
                            <button
                              onClick={() =>
                                handleCopyToClipboard(item.api_url, `url-${item.uuid}`)
                              }
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white rounded transition cursor-pointer shrink-0"
                              title="Copy URL"
                            >
                              <i
                                className={`fa ${
                                  isUrlCopied
                                    ? 'fa-check text-emerald-400'
                                    : 'fa-clipboard'
                                } text-xs`}
                              ></i>
                            </button>
                          </div>
                        </td>

                        {/* API Key (Masked + Show/Hide + Copy) */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 max-w-[320px]">
                            <span className="font-mono text-xs text-slate-200 truncate flex-1 select-all">
                              {isRevealed ? item.api_key : maskApiKey(item.api_key)}
                            </span>

                            {/* Show / Hide Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleReveal(item.uuid)}
                              className="text-slate-400 hover:text-slate-200 p-1 transition cursor-pointer"
                              title={isRevealed ? 'Hide API Key' : 'Reveal API Key'}
                            >
                              <i
                                className={`fa ${
                                  isRevealed ? 'fa-eye-slash' : 'fa-eye'
                                } text-xs`}
                              ></i>
                            </button>

                            {/* Copy button */}
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyToClipboard(item.api_key, `key-${item.uuid}`)
                              }
                              className="text-slate-400 hover:text-indigo-400 p-1 transition cursor-pointer"
                              title="Copy API Key"
                            >
                              <i
                                className={`fa ${
                                  isKeyCopied
                                    ? 'fa-check text-emerald-400'
                                    : 'fa-copy'
                                } text-xs`}
                              ></i>
                            </button>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 text-center">
                          {item.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit API Key"
                            >
                              <i className="fa fa-pencil text-sm"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item.uuid)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Delete API Key"
                            >
                              <i className="fa fa-trash text-sm"></i>
                            </button>
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
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <i className="fa fa-key text-xs"></i>
                </div>
                <h3 className="text-base font-bold text-white">
                  {editItem ? 'Edit API Key' : 'Add New API Key'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <i className="fa fa-times text-base"></i>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Service Identifier Dropdown */}
              <div>
                <label className={labelCls}>
                  Service Identifier <span className="text-rose-400">*</span>
                </label>
                <select
                  value={userAgent}
                  onChange={(e) => setUserAgent(e.target.value)}
                  className={selectCls}
                  required
                >
                  <option value="" disabled>
                    Select Service Identifier...
                  </option>
                  {SERVICE_IDENTIFIERS.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                  {/* Keep any existing custom value if editing */}
                  {userAgent && !SERVICE_IDENTIFIERS.includes(userAgent as any) && (
                    <option value={userAgent}>{userAgent}</option>
                  )}
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Select predefined system identifier for this API key
                </span>
              </div>

              {/* API URL */}
              <div>
                <label className={labelCls}>
                  API URL <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://maps.googleapis.com/maps/api/..."
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* API Key */}
              <div>
                <label className={labelCls}>
                  API Key / Secret Token <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter or paste secret API key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className={`${inputCls} resize-none font-mono text-xs`}
                />
              </div>

              {/* Status */}
              <div>
                <label className={labelCls}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={selectCls}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition cursor-pointer shadow-lg shadow-indigo-900/40 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting && <i className="fa fa-circle-o-notch fa-spin"></i>}
                  <span>{editItem ? 'Update Key' : 'Save Key'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ─────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <i className="fa fa-exclamation-triangle text-xl"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete API Key?</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Are you sure you want to delete this API key? Platform features relying on this service may stop functioning.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition cursor-pointer shadow-lg shadow-rose-900/40"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Popup Alert */}
      <PopupMessage
        show={popup.show}
        type={popup.type}
        message={popup.message}
        onClose={() => setPopup((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}
