import React, { useState, useEffect, useRef } from 'react';
import type { RiderItem } from '../services/types';
import { updateRiderProfile, updateRiderProfilePicture } from '../services/riderApi';
import { newwork_image_url } from '../../../shared/utils/constants';
import noImage from '../../../shared/assets/images/no-image.png';

interface RiderEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  editItem: RiderItem | null;
  onSuccess: (message: string) => void;
}

export default function RiderEditForm({ isOpen, onClose, editItem, onSuccess }: RiderEditFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [isActiveStatus, setIsActiveStatus] = useState('');
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [deviceToken, setDeviceToken] = useState('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editItem && isOpen) {
      setFullName(editItem.full_name || '');
      setEmail(editItem.email || '');
      setPassword('');
      setNidNumber(editItem.nid_number || '');
      setPhoneNumber(editItem.phone_number || '');
      setCountryCode(editItem.country_code || '');
      setIsActiveStatus(editItem.is_active || 'ACTIVE');
      setIsNotificationEnabled(editItem.is_notification_enabled || false);
      setDeviceToken(editItem.device_token_for_notification || '');
      setFormError(null);
      setLocalAvatarUrl(null);
    }
  }, [editItem, isOpen]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      setSubmitting(true);
      setFormError(null);
      const msg = await updateRiderProfile({
        uuid: editItem.uuid,
        full_name: fullName,
        email: email,
        password: password,
        nid_number: nidNumber,
        phone_number: phoneNumber,
        country_code: countryCode,
        is_active: isActiveStatus,
        is_notification_enabled: isNotificationEnabled,
        device_token_for_notification: deviceToken || null
      });
      onSuccess(msg);
    } catch (err: any) {
      setFormError(err.message || 'Error updating profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editItem || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      setUploadingImage(true);
      setFormError(null);
      
      const msg = await updateRiderProfilePicture({
        driver_uuid: editItem.uuid,
        avatar: file
      });
      
      // Update local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setLocalAvatarUrl(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      onSuccess(msg);
    } catch (err: any) {
      setFormError(err.message || 'Error uploading profile picture');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  const currentAvatarUrl = localAvatarUrl || (editItem?.profile_picture ? (editItem.profile_picture.startsWith('http') ? editItem.profile_picture : `${newwork_image_url}${editItem.profile_picture}`) : noImage);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-8">
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl">
            <h3 className="text-lg font-semibold text-white">Edit Rider Profile</h3>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleEditSubmit}>
            <div className="p-6 space-y-6">
              {formError && (
                <div className="px-4 py-3 bg-rose-900/40 border border-rose-700 text-rose-300 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              {/* Profile Picture interactive preview */}
              <div className="flex flex-col items-center gap-2 border-b border-slate-800 pb-6">
                <div 
                  className={`relative group cursor-pointer ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img
                    src={currentAvatarUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-700 group-hover:ring-indigo-500 transition-all"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = noImage; }}
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-500">Click image to upload new avatar</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Country Code *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone Number *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">NID Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm"
                    value={nidNumber}
                    onChange={(e) => setNidNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Device Token for Notification</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm"
                    value={deviceToken}
                    onChange={(e) => setDeviceToken(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status *</label>
                  <select 
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm"
                    value={isActiveStatus} 
                    onChange={(e) => setIsActiveStatus(e.target.value)} 
                    required
                  >
                    {['ACTIVE','INACTIVE','DELETED','BLOCKED','MAINTENANCE','RESTRICTED','PROGRESS'].map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_notification_enabled"
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                    checked={isNotificationEnabled}
                    onChange={(e) => setIsNotificationEnabled(e.target.checked)}
                  />
                  <label htmlFor="is_notification_enabled" className="text-sm font-semibold text-slate-300 select-none cursor-pointer">
                    Enable Notifications
                  </label>
                </div>

              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/40 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 rounded-lg transition-colors cursor-pointer shadow-lg shadow-indigo-900/40"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"></div>
    </>
  );
}
