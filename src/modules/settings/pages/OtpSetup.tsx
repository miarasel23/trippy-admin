import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../../shared/utils/translation';
import { PopupMessage } from '../../../shared/components/PopupMessage';
import { fetchOtpMessagesList, createUpdateOtpMessage, deleteOtpMessage, type OtpMessageItem } from '../services/settingsApi';

const inputCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm";
const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1";
const selectCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm";

export default function OtpSetup() {
  const t = useTranslation();
  const [messages, setMessages] = useState<OtpMessageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<OtpMessageItem | null>(null);
  const [countyCode, setCountyCode] = useState<string>('BD');
  const [otpCode, setOtpCode] = useState<string>('CUSTOMER_REGISTRATION');
  const [otpMessage, setOtpMessage] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteTargetUuid, setDeleteTargetUuid] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });

  const loadData = async () => {
    try { setLoading(true); setError(null); setMessages(await fetchOtpMessagesList()); }
    catch (err: any) { setError(err.message || 'Error loading OTP messages'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleEditClick = (item: OtpMessageItem) => { setEditItem(item); setCountyCode(item.county_code_for_otp); setOtpCode(item.otp_code); setOtpMessage(item.otp_message); setStatus(item.status); setFormError(null); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setEditItem(null); setCountyCode('BD'); setOtpCode('CUSTOMER_REGISTRATION'); setOtpMessage(''); setStatus('ACTIVE'); setFormError(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpMessage.trim()) { setFormError('OTP message text is required'); return; }
    try {
      setSubmitting(true); setFormError(null);
      await createUpdateOtpMessage({ county_code_for_otp: countyCode, otp_code: otpCode, otp_message: otpMessage.trim(), status, uuid: editItem?.uuid });
      handleCloseModal(); await loadData();
      setPopup({ show: true, type: 'success', message: editItem ? 'OTP message updated successfully' : 'OTP message created successfully' });
    } catch (err: any) { setFormError(err.response?.data?.message || err.response?.data?.detail || err.message || 'Error saving.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = (uuid: string) => { setDeleteTargetUuid(uuid); setShowDeleteConfirm(true); };

  const confirmDelete = async () => {
    if (!deleteTargetUuid) return;
    try {
      setLoading(true); setShowDeleteConfirm(false);
      await deleteOtpMessage(deleteTargetUuid); setDeleteTargetUuid(null); await loadData();
      setPopup({ show: true, type: 'success', message: 'OTP message deleted successfully' });
    } catch (err: any) { setPopup({ show: true, type: 'error', message: err.response?.data?.message || err.message || 'Failed to delete' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white">OTP Setup Messages</h2>
        <button onClick={() => { setFormError(null); setShowModal(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-900/40">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add OTP Message
        </button>
      </div>

      <div className="overflow-x-auto">
        {loading && (<div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>)}
        {error && <div className="m-4 px-4 py-3 bg-rose-900/40 border border-rose-700 text-rose-300 rounded-lg text-sm">{error}</div>}
        {!loading && !error && (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-800/60 text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3 w-14 text-center">{t('slNo')}</th>
                <th className="px-4 py-3">Country Code</th>
                <th className="px-4 py-3">OTP Trigger Code</th>
                <th className="px-4 py-3">OTP Message Template</th>
                <th className="px-4 py-3 text-center">{t('status')}</th>
                <th className="px-4 py-3 text-center w-36">{t('actionLabel')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {messages.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No OTP setup messages found.</td></tr>
              ) : messages.map((item, index) => (
                <tr key={item.uuid} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-center text-slate-400 font-mono">{index + 1}</td>
                  <td className="px-4 py-3"><span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-700">{item.county_code_for_otp}</span></td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs">{item.otp_code}</td>
                  <td className="px-4 py-3 font-medium text-slate-200 max-w-sm">{item.otp_message}</td>
                  <td className="px-4 py-3 text-center">
                    {item.status === 'ACTIVE' ? <span className="px-2.5 py-1 bg-emerald-900/50 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-700/50">{t('active') || 'Active'}</span>
                      : <span className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-semibold border border-slate-700">{t('inactive') || 'Inactive'}</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEditClick(item)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors cursor-pointer">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        {t('edit')}
                      </button>
                      <button onClick={() => handleDelete(item.uuid)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors cursor-pointer">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-8">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl">
                <h3 className="text-lg font-semibold text-white">{editItem ? 'Edit OTP Message' : 'Add OTP Message'}</h3>
                <button onClick={handleCloseModal} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {formError && <div className="px-3 py-2 bg-rose-900/40 border border-rose-700 text-rose-300 rounded-lg text-sm">{formError}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Country Code *</label>
                    <select className={selectCls} value={countyCode} onChange={(e) => setCountyCode(e.target.value)} required>
                      <option value="BD">BD (Bangladesh)</option>
                      <option value="US">US (United States)</option>
                      <option value="GB">GB (United Kingdom)</option>
                      <option value="IN">IN (India)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>OTP Trigger Code *</label>
                    <select className={selectCls} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required>
                      {['CUSTOMER_REGISTRATION','DRIVER_REGISTRATION','LOGIN','FORGET_PASSWORD','WITHDRAW','RIDE_START_OTP','BOOK_CONFIRM_OTP','BOOK_CANCEL_OTP','BOOK_START_OTP','BOOK_END_OTP'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Status *</label>
                    <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)} required>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>OTP Message Template *</label>
                  <textarea className={inputCls} rows={4} placeholder="e.g., THIS IS CUSTOMER REG OTP: {otp_code}" value={otpMessage} onChange={(e) => setOtpMessage(e.target.value)} required />
                  <p className="text-xs text-slate-500 mt-1">Use <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">{'{otp_code}'}</code> as a placeholder where the numeric OTP code should be injected.</p>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                  <button type="button" onClick={handleCloseModal} disabled={submitting} className="px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">{t('cancel')}</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 rounded-lg transition-colors cursor-pointer">
                    {submitting ? t('submitting') : (editItem ? 'Save Changes' : 'Create')}
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
                <p className="text-slate-300">Are you sure you want to delete this OTP message?</p>
                <p className="text-slate-500 text-sm mt-1">This action cannot be undone.</p>
              </div>
              <div className="flex justify-end gap-3 px-6 pb-5">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteTargetUuid(null); }} className="px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">Cancel</button>
                <button onClick={confirmDelete} className="px-5 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer">Delete</button>
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"></div>
        </>
      )}
    </div>
  );
}
