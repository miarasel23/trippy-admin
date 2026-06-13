import React, { useEffect, useState } from 'react';
import { fetchRoleList, fetchPermissionList, createRole } from '../services/settingsApi';
import { PopupMessage } from '../../../shared/components/PopupMessage';
import type { RoleItem, PermissionItem } from '../services/types';
import { useTranslation } from '../../../shared/utils/translation';

const inputCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm";
const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1";

export default function RoleList() {
  const t = useTranslation();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editRoleItem, setEditRoleItem] = useState<RoleItem | null>(null);
  const [permissionFilter, setPermissionFilter] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'error', message: '' });

  const loadData = async () => {
    try {
      setLoading(true); setError(null);
      const [rolesData, permsData] = await Promise.all([fetchRoleList(), fetchPermissionList()]);
      setRoles(rolesData); setPermissions(permsData);
    } catch (err: any) { setError(err.message || 'Error fetching roles'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filteredPermissions = permissions.filter(p => p.name.toLowerCase().includes(permissionFilter.toLowerCase()) || p.code.toLowerCase().includes(permissionFilter.toLowerCase()));

  const handleCheckboxChange = (permCode: string) => setSelectedPermissions(prev => prev.includes(permCode) ? prev.filter(c => c !== permCode) : [...prev, permCode]);
  const handleSelectAllFiltered = () => { const codes = filteredPermissions.map(p => p.code); setSelectedPermissions(prev => Array.from(new Set([...prev, ...codes]))); };
  const handleDeselectAllFiltered = () => { const codes = filteredPermissions.map(p => p.code); setSelectedPermissions(prev => prev.filter(c => !codes.includes(c))); };

  const handleEditClick = (item: RoleItem) => { setEditRoleItem(item); setFormName(item.name); setFormDescription(item.description || ''); setSelectedPermissions(item.permissions ? item.permissions.map(p => p.code) : []); setFormError(null); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setEditRoleItem(null); setFormName(''); setFormDescription(''); setSelectedPermissions([]); setPermissionFilter(''); setFormError(null); };

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) { setFormError(t('nameRequiredError')); return; }
    if (selectedPermissions.length === 0) { setFormError(t('selectAtLeastOneError')); return; }
    try {
      setSubmitting(true); setFormError(null);
      await createRole({ name: formName.trim(), description: formDescription.trim() || null, permissions: selectedPermissions });
      handleCloseModal(); await loadData();
      setPopup({ show: true, type: 'success', message: editRoleItem ? t('roleUpdatedSuccess') : t('roleCreatedSuccess') });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to save role';
      setFormError(msg); setPopup({ show: true, type: 'error', message: msg });
    } finally { setSubmitting(false); }
  };

  const filteredRoles = roles.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) || item.uuid.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-lg font-bold text-white">{t('roleList')}</h2>
          <div className="relative">
            <input type="text" className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-56 transition-colors"
              placeholder={t('searchRoles')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
        <button onClick={() => { setFormError(null); setShowModal(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-900/40">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {t('addRole')}
        </button>
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
                <th className="px-4 py-3">{t('roleName')}</th>
                <th className="px-4 py-3">{t('description')}</th>
                <th className="px-4 py-3">{t('permissionsCount')}</th>
                <th className="px-4 py-3">{t('permissions')}</th>
                <th className="px-4 py-3 w-24">{t('actionLabel')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRoles.map((item, index) => (
                <tr key={item.uuid} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono">{index + 1}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500 max-w-xs truncate">{item.uuid}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 bg-indigo-900/50 text-indigo-300 rounded-md text-xs font-semibold border border-indigo-700/50">{item.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{item.description || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 bg-sky-900/50 text-sky-300 rounded-md text-xs font-semibold border border-sky-700/50">{item.permissions ? item.permissions.length : 0} perms</span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="text-xs text-slate-500 max-h-14 overflow-y-auto leading-relaxed">
                      {item.permissions && item.permissions.length > 0 ? item.permissions.map(p => p.name).join(', ') : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEditClick(item)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors cursor-pointer">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      {t('edit')}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRoles.length === 0 && (<tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">{t('noRolesFound')}</td></tr>)}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Role Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-8">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl">
                <h3 className="text-lg font-semibold text-white">{editRoleItem ? t('editRole') : t('addNewRole')}</h3>
                <button onClick={handleCloseModal} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmitRole} className="p-5 space-y-4">
                {formError && <div className="px-3 py-2 bg-rose-900/40 border border-rose-700 text-rose-300 rounded-lg text-sm">{formError}</div>}
                <div>
                  <label className={labelCls}>{t('roleNameRequired')} <span className="text-rose-400">*</span></label>
                  <input type="text" className={inputCls} placeholder="e.g. Sub-Admin" value={formName} onChange={(e) => setFormName(e.target.value)} required disabled={!!editRoleItem} />
                </div>
                <div>
                  <label className={labelCls}>{t('description')}</label>
                  <textarea className={inputCls} rows={2} placeholder={t('describeResponsibilities')} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <label className={labelCls + ' m-0'}>
                      {t('selectPermissions')} <span className="text-rose-400">*</span>
                      <span className="ml-2 text-indigo-400 normal-case font-normal">({selectedPermissions.length} selected)</span>
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button type="button" onClick={handleSelectAllFiltered} className="px-2.5 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors cursor-pointer">Select All</button>
                      <button type="button" onClick={handleDeselectAllFiltered} className="px-2.5 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors cursor-pointer">Clear All</button>
                      <div className="relative">
                        <input type="text" className="pl-7 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs w-40"
                          placeholder={t('filterPermissions')} value={permissionFilter} onChange={(e) => setPermissionFilter(e.target.value)} />
                        <svg className="absolute left-2 top-2 w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    {filteredPermissions.map(p => (
                      <label key={p.uuid} className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                        <input type="checkbox" className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" checked={selectedPermissions.includes(p.code)} onChange={() => handleCheckboxChange(p.code)} />
                        <span className="text-xs">
                          <span className="font-medium text-slate-200">{p.name}</span>
                          <span className="text-slate-500 ml-1">({p.code})</span>
                        </span>
                      </label>
                    ))}
                    {filteredPermissions.length === 0 && <div className="col-span-2 text-center text-slate-500 text-sm py-4">{t('noPermissionsMatch')}</div>}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                  <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">{t('cancel')}</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 rounded-lg transition-colors cursor-pointer">
                    {submitting ? t('submitting') : (editRoleItem ? t('updateRole') : t('saveRole'))}
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
