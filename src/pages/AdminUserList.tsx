import React, { useEffect, useState } from 'react';
import { fetchAdminUserList, createAdminUser, editAdminUser, fetchRoleList, newwork_image_url, uploadAdminProfilePicture } from '../utilities/api';
import { PopupMessage } from '../components/common/PopupMessage';
import { useTranslation } from '../utilities/translation';
import type { RoleItem } from '../store/action';
import noImage from '../assets/no-image.png';

interface AdminUserItem {
  uuid: string; first_name: string; last_name: string; phone_number: string; country_code: string;
  username: string; email: string; is_active: boolean | number; is_superuser: boolean | number;
  profile_picture?: string | null;
  role?: { uuid: string; name: string; description: string; } | null;
}

const inputCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm";
const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1";
const selectCls = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm";

export default function AdminUserList() {
  const t = useTranslation();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<AdminUserItem | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('+880');
  const [password, setPassword] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isActive, setIsActive] = useState<number>(1);
  const [isSuperuser, setIsSuperuser] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'error', message: '' });

  const loadData = async () => {
    try {
      setLoading(true); setError(null);
      const [usersData, rolesData] = await Promise.all([fetchAdminUserList(), fetchRoleList()]);
      setUsers(usersData); setRoles(rolesData);
    } catch (err: any) { setError(err.message || 'Error loading data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleEditClick = (item: AdminUserItem) => {
    setEditItem(item); setFirstName(item.first_name); setLastName(item.last_name);
    setUsername(item.username); setEmail(item.email); setPhoneNumber(item.phone_number);
    setCountryCode(item.country_code || '+880'); setSelectedRole(item.role?.name || '');
    setIsActive(item.is_active ? 1 : 0); setIsSuperuser(item.is_superuser ? 1 : 0);
    setPassword(''); setFormError(null); setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false); setEditItem(null); setFirstName(''); setLastName(''); setUsername('');
    setEmail(''); setPhoneNumber(''); setCountryCode('+880'); setPassword('');
    setSelectedRole(''); setIsActive(1); setIsSuperuser(0); setFormError(null);
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editItem) return;
    try {
      setSubmitting(true); setFormError(null);
      const res = await uploadAdminProfilePicture(editItem.uuid, e.target.files[0]);
      const updatedProfilePic = res.profile_picture;
      setEditItem(prev => prev ? { ...prev, profile_picture: updatedProfilePic } : null);
      setUsers(prev => prev.map(u => u.uuid === editItem.uuid ? { ...u, profile_picture: updatedProfilePic } : u));
      setPopup({ show: true, type: 'success', message: 'Profile picture updated successfully' });
    } catch (err: any) { setFormError(err.response?.data?.message || err.message || 'Failed to upload'); }
    finally { setSubmitting(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) { setFormError('First and Last names are required'); return; }
    if (!username.trim()) { setFormError(t('usernameRequired')); return; }
    if (!email.trim()) { setFormError(t('emailRequired')); return; }
    if (!phoneNumber.trim()) { setFormError(t('phoneRequired')); return; }
    if (!selectedRole) { setFormError('Please select a Role'); return; }
    try {
      setSubmitting(true); setFormError(null);
      const payload: any = { first_name: firstName.trim(), last_name: lastName.trim(), phone_number: phoneNumber.trim(), country_code: countryCode.trim(), username: username.trim(), email: email.trim(), role: selectedRole, is_active: isActive, is_superuser: isSuperuser, password };
      if (editItem) { payload.uuid = editItem.uuid; if (password === '') delete payload.password; await editAdminUser(payload); }
      else { await createAdminUser(payload); }
      handleCloseModal(); await loadData();
      setPopup({ show: true, type: 'success', message: editItem ? t('adminUpdatedSuccess') : t('adminCreatedSuccess') });
    } catch (err: any) { setFormError(err.response?.data?.detail || err.message || 'Error saving.'); }
    finally { setSubmitting(false); }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.role?.name || '').toLowerCase().includes(q);
  });

  return (
    <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-lg font-bold text-white">{t('adminUserList')}</h2>
          <div className="relative">
            <input type="text" className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-56 transition-colors"
              placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
        <button onClick={() => { setFormError(null); setShowModal(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-900/40">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {t('createAdminUser')}
        </button>
      </div>

      <div className="overflow-x-auto">
        {loading && (<div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>)}
        {error && <div className="m-4 px-4 py-3 bg-rose-900/40 border border-rose-700 text-rose-300 rounded-lg text-sm">{error}</div>}
        {!loading && !error && (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-800/60 text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3 w-14 text-center">SL</th>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">{t('username')}</th>
                <th className="px-4 py-3">{t('email')}</th>
                <th className="px-4 py-3">{t('phoneNumber')}</th>
                <th className="px-4 py-3">{t('role')}</th>
                <th className="px-4 py-3 text-center">{t('status')}</th>
                <th className="px-4 py-3 text-center">Superuser</th>
                <th className="px-4 py-3 text-center">{t('actionLabel')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-500">No admin users match the search query.</td></tr>
              ) : filteredUsers.map((item, index) => {
                const avatarUrl = item.profile_picture ? (item.profile_picture.startsWith('http') ? item.profile_picture : `${newwork_image_url}${item.profile_picture}`) : noImage;
                return (
                  <tr key={item.uuid} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-400 font-mono">{index + 1}</td>
                    <td className="px-4 py-3">
                      <img src={avatarUrl} alt={item.username} className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-700" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = noImage; }} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{item.first_name} {item.last_name}</td>
                    <td className="px-4 py-3 font-mono text-slate-400 text-xs">{item.username}</td>
                    <td className="px-4 py-3 text-slate-300">{item.email}</td>
                    <td className="px-4 py-3 text-slate-400">{item.country_code} {item.phone_number}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 bg-indigo-900/50 text-indigo-300 rounded-md text-xs font-semibold border border-indigo-700/50">{item.role?.name || 'No Role'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.is_active ? <span className="px-2.5 py-1 bg-emerald-900/50 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-700/50">{t('active')}</span>
                        : <span className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-semibold border border-slate-700">{t('inactive')}</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.is_superuser ? <span className="px-2.5 py-1 bg-amber-900/50 text-amber-300 rounded-full text-xs font-semibold border border-amber-700/50">{t('yes')}</span>
                        : <span className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-semibold border border-slate-700">{t('no')}</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleEditClick(item)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors cursor-pointer mx-auto">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        {t('edit')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-8">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl">
                <h3 className="text-lg font-semibold text-white">{editItem ? t('editAdminUser') : t('createAdminUser')}</h3>
                <button onClick={handleCloseModal} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {formError && <div className="px-3 py-2 bg-rose-900/40 border border-rose-700 text-rose-300 rounded-lg text-sm">{formError}</div>}
                {editItem && (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <img src={editItem.profile_picture ? (editItem.profile_picture.startsWith('http') ? editItem.profile_picture : `${newwork_image_url}${editItem.profile_picture}`) : noImage}
                      alt="Profile" className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-700" />
                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg cursor-pointer transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Upload Photo
                      <input type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
                    </label>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelCls}>{t('firstName')} *</label><input type="text" className={inputCls} placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
                  <div><label className={labelCls}>{t('lastName')} *</label><input type="text" className={inputCls} placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
                  <div><label className={labelCls}>{t('username')} *</label><input type="text" className={inputCls} placeholder="johndoe" value={username} onChange={(e) => setUsername(e.target.value)} disabled={!!editItem} required /></div>
                  <div><label className={labelCls}>{t('email')} *</label><input type="email" className={inputCls} placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                  <div><label className={labelCls}>{t('countryCode')} *</label><input type="text" className={inputCls} placeholder="+880" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} required /></div>
                  <div><label className={labelCls}>{t('phoneNumber')} *</label><input type="text" className={inputCls} placeholder="1XXXXXXXXX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required /></div>
                  <div><label className={labelCls}>{t('password')} {!editItem && '*'}</label><input type="password" className={inputCls} placeholder="******" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                  <div>
                    <label className={labelCls}>{t('role')} *</label>
                    <select className={selectCls} value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} required>
                      <option value="">-- Select Role --</option>
                      {roles.map(r => <option key={r.uuid} value={r.name}>{r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t('status')}</label>
                    <select className={selectCls} value={isActive} onChange={(e) => setIsActive(Number(e.target.value))}>
                      <option value={1}>{t('active')}</option>
                      <option value={0}>{t('inactive')}</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Superuser Access</label>
                    <select className={selectCls} value={isSuperuser} onChange={(e) => setIsSuperuser(Number(e.target.value))}>
                      <option value={0}>{t('no')}</option>
                      <option value={1}>{t('yes')}</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                  <button type="button" onClick={handleCloseModal} disabled={submitting} className="px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">{t('cancel')}</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 rounded-lg transition-colors cursor-pointer">
                    {submitting ? t('submitting') : (editItem ? 'Save Changes' : 'Create User')}
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
