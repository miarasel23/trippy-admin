import React, { useEffect, useState } from 'react';
import { fetchActionListWithLanguage, createUpdateLanguage } from '../utilities/api';
import { PopupMessage } from '../components/common/PopupMessage';
import type { ActionWithLanguageItem } from '../store/action';

const inputCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm";
const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1";

export default function ActionLanguageList() {
  const [actions, setActions] = useState<ActionWithLanguageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'id' | 'action_when'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedAction, setSelectedAction] = useState<ActionWithLanguageItem | null>(null);
  const [englishMessage, setEnglishMessage] = useState<string>('');
  const [bengaliMessage, setBengaliMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'error', message: '' });

  const loadActions = async () => {
    try { setLoading(true); setError(null); setActions(await fetchActionListWithLanguage()); }
    catch (err: any) { setError(err.message || 'Error fetching actions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadActions(); }, []);

  const handleSort = (field: 'id' | 'action_when') => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const handleTranslateClick = (item: ActionWithLanguageItem) => {
    setSelectedAction(item);
    setEnglishMessage(item.messages.find(m => m.language_code === 'en')?.message || '');
    setBengaliMessage(item.messages.find(m => m.language_code === 'bn')?.message || '');
    setFormError(null); setShowModal(true);
  };

  const handleSubmitTranslation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) return;
    try {
      setSubmitting(true); setFormError(null);
      const enUuid = selectedAction.messages.find(m => m.language_code === 'en')?.uuid || null;
      const bnUuid = selectedAction.messages.find(m => m.language_code === 'bn')?.uuid || null;
      await createUpdateLanguage({ action_uuid: selectedAction.uuid, action_when: selectedAction.action_when, messages: [{ language_code: 'en', message: englishMessage.trim(), uuid: enUuid }, { language_code: 'bn', message: bengaliMessage.trim(), uuid: bnUuid }] });
      setShowModal(false); setSelectedAction(null); await loadActions();
      setPopup({ show: true, type: 'success', message: 'Translations updated successfully' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to update translations';
      setFormError(msg); setPopup({ show: true, type: 'error', message: msg });
    } finally { setSubmitting(false); }
  };

  const filteredActions = actions.filter((item) => {
    const q = searchQuery.toLowerCase();
    return item.action_when.toLowerCase().includes(q) || item.uuid.toLowerCase().includes(q) || item.id.toString().includes(q) || item.messages.some(m => m.message.toLowerCase().includes(q));
  });
  const sortedActions = [...filteredActions].sort((a, b) => {
    let cmp = sortField === 'id' ? a.id - b.id : a.action_when.localeCompare(b.action_when);
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-lg font-bold text-white">Action with Language List</h2>
          <div className="relative">
            <input type="text" className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-64 transition-colors"
              placeholder="Search actions or translations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
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
                <th className="px-4 py-3 cursor-pointer select-none hover:text-slate-200 transition-colors" onClick={() => handleSort('action_when')}>
                  <div className="flex items-center gap-1">
                    Action When
                    {sortField === 'action_when' ? (
                      sortDirection === 'asc' ? <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                      : <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    ) : null}
                  </div>
                </th>
                <th className="px-4 py-3">English Translation</th>
                <th className="px-4 py-3">Bengali Translation</th>
                <th className="px-4 py-3 w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedActions.map((item, index) => {
                const enMsg = item.messages.find(m => m.language_code === 'en')?.message || '-';
                const bnMsg = item.messages.find(m => m.language_code === 'bn')?.message || '-';
                return (
                  <tr key={item.uuid} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono">{index + 1}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500 max-w-xs truncate">{item.uuid}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 bg-sky-900/50 text-sky-300 rounded-md text-xs font-semibold border border-sky-700/50 capitalize">{item.action_when.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs">{enMsg}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs">{bnMsg}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleTranslateClick(item)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-violet-600 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors cursor-pointer">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                        Translate
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sortedActions.length === 0 && (<tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No actions match the search query.</td></tr>)}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Translations Modal */}
      {showModal && selectedAction && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-t-2xl">
                <h3 className="text-lg font-semibold text-white">Manage Translations</h3>
                <button onClick={() => { setShowModal(false); setSelectedAction(null); }} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmitTranslation} className="p-5 space-y-4">
                {formError && <div className="px-3 py-2 bg-rose-900/40 border border-rose-700 text-rose-300 rounded-lg text-sm">{formError}</div>}
                <div>
                  <label className={labelCls}>Action When</label>
                  <div className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 text-sm">{selectedAction.action_when}</div>
                </div>
                <div>
                  <label className={labelCls}>English Translation</label>
                  <textarea className={inputCls} rows={3} placeholder="Enter English message..." value={englishMessage} onChange={(e) => setEnglishMessage(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Bengali Translation</label>
                  <textarea className={inputCls} rows={3} placeholder="Enter Bengali message..." value={bengaliMessage} onChange={(e) => setBengaliMessage(e.target.value)} />
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                  <button type="button" onClick={() => { setShowModal(false); setSelectedAction(null); }} className="px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-60 rounded-lg transition-colors cursor-pointer">
                    {submitting ? 'Submitting...' : 'Save Translations'}
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
