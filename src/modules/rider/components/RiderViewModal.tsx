import { useEffect, useState } from 'react';
import type { RiderItem, DriverDocumentItem, CarPhotoItem } from '../services/types';
import { fetchRiderDocuments, fetchRiderCarPhotos, updateDriverDocumentStatus, updateCarPhotoStatus } from '../services/riderApi';
import { newwork_image_url } from '../../../shared/utils/constants';
import noImage from '../../../shared/assets/images/no-image.png';
import ImagePreviewModal from '../../trip/components/ImagePreviewModal';
import { PopupMessage } from '../../../shared/components/PopupMessage';
import RiderTripHistory from './RiderTripHistory';

interface RiderViewModalProps {
  item: RiderItem | null;
  onClose: () => void;
}

type TabType = 'info' | 'document' | 'carPhotos' | 'trips';

export default function RiderViewModal({ item, onClose }: RiderViewModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [documents, setDocuments] = useState<DriverDocumentItem[]>([]);
  const [carPhotos, setCarPhotos] = useState<CarPhotoItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });
  const [confirmAction, setConfirmAction] = useState<{ show: boolean; id: number | null; newStatus: string; type: 'document' | 'carPhoto' }>({ show: false, id: null, newStatus: '', type: 'document' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-emerald-400';
      case 'INACTIVE': return 'text-slate-400';
      case 'DELETED': return 'text-rose-500';
      case 'BLOCKED': return 'text-rose-600';
      case 'MAINTENANCE': return 'text-amber-500';
      case 'RESTRICTED': return 'text-orange-500';
      case 'PROGRESS': return 'text-blue-400';
      default: return 'text-slate-300';
    }
  };

  const formatTitle = (title: string | undefined | null, fallback: string) => {
    if (!title) return fallback;
    return title.replace(/_/g, ' ');
  };

  useEffect(() => {
    if (item && activeTab === 'document' && documents.length === 0) {
      loadDocuments();
    }
    if (item && activeTab === 'carPhotos' && carPhotos.length === 0) {
      loadPhotos();
    }
  }, [item, activeTab]);

  const loadDocuments = async () => {
    if (!item) return;
    try {
      setLoadingDocs(true);
      const data = await fetchRiderDocuments(item.uuid);
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const loadPhotos = async () => {
    if (!item) return;
    try {
      setLoadingPhotos(true);
      const data = await fetchRiderCarPhotos(item.uuid);
      setCarPhotos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const processDocumentStatusChange = async (id: number, newStatus: string) => {
    try {
      setUpdatingId(id);
      const msg = await updateDriverDocumentStatus(id, newStatus);
      setPopup({ show: true, type: 'success', message: msg });
      await loadDocuments();
    } catch (err: any) {
      console.error('Failed to update document status', err);
      setPopup({ show: true, type: 'error', message: err.message || 'Failed to update status' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDocumentStatusChange = async (id: number, newStatus: string) => {
    if (newStatus === 'ACTIVE') {
      setConfirmAction({ show: true, id, newStatus, type: 'document' });
      return;
    }
    await processDocumentStatusChange(id, newStatus);
  };

  const processCarPhotoStatusChange = async (id: number, newStatus: string) => {
    try {
      setUpdatingId(id);
      const msg = await updateCarPhotoStatus(id, newStatus);
      setPopup({ show: true, type: 'success', message: msg });
      await loadPhotos();
    } catch (err: any) {
      console.error('Failed to update car photo status', err);
      setPopup({ show: true, type: 'error', message: err.message || 'Failed to update status' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCarPhotoStatusChange = async (id: number, newStatus: string) => {
    if (newStatus === 'ACTIVE') {
      setConfirmAction({ show: true, id, newStatus, type: 'carPhoto' });
      return;
    }
    await processCarPhotoStatusChange(id, newStatus);
  };

  const executeConfirmAction = async () => {
    if (confirmAction.id === null) return;
    const { id, newStatus, type } = confirmAction;
    setConfirmAction({ show: false, id: null, newStatus: '', type: 'document' });
    if (type === 'document') {
      await processDocumentStatusChange(id, newStatus);
    } else {
      await processCarPhotoStatusChange(id, newStatus);
    }
  };

  if (!item) return null;

  const avatarUrl = item.profile_picture
    ? (item.profile_picture.startsWith('http') ? item.profile_picture : `${newwork_image_url}${item.profile_picture}`)
    : noImage;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        <div className="relative bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-800 animate-fadeIn">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/50">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <i className="fa fa-user-circle text-indigo-500"></i>
              Rider Details
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <i className="fa fa-times text-xl"></i>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-6 border-b border-slate-800 bg-slate-900 overflow-x-auto overflow-y-hidden custom-scrollbar">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'info'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
            >
              <i className="fa fa-info-circle mr-2"></i>Rider Info
            </button>
            <button
              onClick={() => setActiveTab('document')}
              className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'document'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
            >
              <i className="fa fa-file-text mr-2"></i>Rider Document
            </button>
            <button
              onClick={() => setActiveTab('carPhotos')}
              className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'carPhotos'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
            >
              <i className="fa fa-car mr-2"></i>Car Photos
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'trips'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
            >
              <i className="fa fa-history mr-2"></i>Trip History
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto custom-scrollbar flex-1 bg-slate-950/30">
            <div className="p-6">
              {activeTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Profile Picture */}
                  <div className="col-span-1 flex flex-col items-center">
                    <div className="relative group cursor-pointer" onClick={() => setPreviewImage({ url: avatarUrl, title: item.full_name || 'Rider Avatar' })}>
                      <img
                        src={avatarUrl}
                        alt={item.full_name || 'Rider'}
                        className="w-48 h-48 rounded-full object-cover ring-4 ring-slate-800 group-hover:ring-indigo-500/50 transition-all shadow-xl"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = noImage; }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <i className="fa fa-search-plus text-white text-2xl"></i>
                      </div>
                    </div>
                    <h4 className="mt-4 text-xl font-bold text-white text-center">{item.full_name || 'N/A'}</h4>
                    <span className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold ${item.is_active === 'ACTIVE'
                      ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                      : 'bg-rose-900/50 text-rose-300 border border-rose-700/50'
                      }`}>
                      {item.is_active || 'UNKNOWN'}
                    </span>
                  </div>

                  {/* Info List */}
                  <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Phone Number</p>
                      <p className="text-slate-300 font-medium mt-1">{item.country_code} {item.phone_number}</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Email</p>
                      <p className="text-slate-300 font-medium mt-1">{item.email || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-500 uppercase font-semibold">NID Number</p>
                      <p className="text-slate-300 font-medium mt-1">{item.nid_number || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-500 uppercase font-semibold">UUID</p>
                      <p className="text-slate-300 font-medium mt-1 text-xs break-all">{item.uuid}</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Notifications</p>
                      <p className="text-slate-300 font-medium mt-1">
                        {item.is_notification_enabled ? (
                          <span className="text-emerald-400"><i className="fa fa-bell mr-1"></i>Enabled</span>
                        ) : (
                          <span className="text-slate-500"><i className="fa fa-bell-slash mr-1"></i>Disabled</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Role</p>
                      <p className="text-slate-300 font-medium mt-1">{item.role?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'document' && (
                <div className="mt-4">
                  {loadingDocs ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
                    </div>
                  ) : documents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {documents.map((doc) => {
                        const docUrl = doc.document_url ? (doc.document_url.startsWith('http') ? doc.document_url : `${newwork_image_url}${doc.document_url}`) : noImage;
                        return (
                          <div key={doc.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group">
                            <div
                              className="aspect-video relative overflow-hidden cursor-pointer bg-slate-950"
                              onClick={() => setPreviewImage({ url: docUrl, title: doc.document_type || 'Document' })}
                            >
                              <img
                                src={docUrl}
                                alt={doc.document_type || 'Document'}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-300"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = noImage; }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                <i className="fa fa-search-plus text-white text-2xl drop-shadow-md"></i>
                              </div>
                            </div>
                            <div className="p-4">
                            <h5 className="text-sm font-bold text-white mb-1 truncate" title={formatTitle(doc.document_type, 'Unknown Document')}>{formatTitle(doc.document_type, 'Unknown Document')}</h5>
                            <p className="text-xs text-slate-400 mb-2">Number: <span className="text-slate-300 font-mono">{doc.document_number || 'N/A'}</span></p>
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/50">
                              <select
                                value={doc.is_verified || 'PROGRESS'}
                                onChange={(e) => handleDocumentStatusChange(doc.id, e.target.value)}
                                disabled={updatingId === doc.id}
                                className={`text-xs px-2 py-1 rounded cursor-pointer border border-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-950 ${
                                  updatingId === doc.id ? 'opacity-50 cursor-not-allowed' : ''
                                } ${getStatusColor(doc.is_verified || 'PROGRESS')}`}
                              >
                                <option value="ACTIVE" className="text-emerald-400">ACTIVE</option>
                                <option value="INACTIVE" className="text-slate-400">INACTIVE</option>
                                <option value="DELETED" className="text-rose-500">DELETED</option>
                                <option value="BLOCKED" className="text-rose-600">BLOCKED</option>
                                <option value="MAINTENANCE" className="text-amber-500">MAINTENANCE</option>
                                <option value="RESTRICTED" className="text-orange-500">RESTRICTED</option>
                                <option value="PROGRESS" className="text-blue-400">PROGRESS</option>
                              </select>
                              {updatingId === doc.id && (
                                <i className="fa fa-spinner fa-spin text-slate-400 text-xs"></i>
                              )}
                            </div>
                          </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                      <i className="fa fa-file-text-o text-4xl mb-4 text-slate-700"></i>
                      <p>No documents found for this rider.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'carPhotos' && (
                <div className="mt-4">
                  {loadingPhotos ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
                    </div>
                  ) : carPhotos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {carPhotos.map((photo) => {
                        const photoUrl = photo.document_url ? (photo.document_url.startsWith('http') ? photo.document_url : `${newwork_image_url}${photo.document_url}`) : noImage;
                        return (
                          <div key={photo.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group">
                            <div
                              className="aspect-video relative overflow-hidden cursor-pointer bg-slate-950"
                              onClick={() => setPreviewImage({ url: photoUrl, title: photo.document_type || 'Car Photo' })}
                            >
                              <img
                                src={photoUrl}
                                alt={photo.document_type || 'Car Photo'}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-300"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = noImage; }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                <i className="fa fa-search-plus text-white text-2xl drop-shadow-md"></i>
                              </div>
                            </div>
                            <div className="p-4">
                            <h5 className="text-sm font-bold text-white mb-1 truncate" title={formatTitle(photo.document_type, 'Car Photo')}>{formatTitle(photo.document_type, 'Car Photo')}</h5>
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/50">
                              <select
                                value={photo.is_verified || 'PROGRESS'}
                                onChange={(e) => handleCarPhotoStatusChange(photo.id, e.target.value)}
                                disabled={updatingId === photo.id}
                                className={`text-xs px-2 py-1 rounded cursor-pointer border border-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-950 ${
                                  updatingId === photo.id ? 'opacity-50 cursor-not-allowed' : ''
                                } ${getStatusColor(photo.is_verified || 'PROGRESS')}`}
                              >
                                <option value="ACTIVE" className="text-emerald-400">ACTIVE</option>
                                <option value="INACTIVE" className="text-slate-400">INACTIVE</option>
                                <option value="DELETED" className="text-rose-500">DELETED</option>
                                <option value="BLOCKED" className="text-rose-600">BLOCKED</option>
                                <option value="MAINTENANCE" className="text-amber-500">MAINTENANCE</option>
                                <option value="RESTRICTED" className="text-orange-500">RESTRICTED</option>
                                <option value="PROGRESS" className="text-blue-400">PROGRESS</option>
                              </select>
                              {updatingId === photo.id && (
                                <i className="fa fa-spinner fa-spin text-slate-400 text-xs"></i>
                              )}
                            </div>
                          </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                      <i className="fa fa-car text-4xl mb-4 text-slate-700"></i>
                      <p>No car photos found for this rider.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'trips' && (
                <div className="mt-4">
                  <RiderTripHistory driverUuid={item.uuid} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <PopupMessage show={popup.show} type={popup.type} message={popup.message} onClose={() => setPopup(prev => ({ ...prev, show: false }))} />

      <PopupMessage
        show={confirmAction.show}
        type="confirm"
        title="Confirm Activation"
        message={`Are you sure you want to change this ${confirmAction.type === 'document' ? 'document' : 'car photo'} to ACTIVE?`}
        onClose={() => setConfirmAction({ show: false, id: null, newStatus: '', type: 'document' })}
        onConfirm={executeConfirmAction}
      />

      {previewImage && (
        <ImagePreviewModal
          previewImage={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </>
  );
}
