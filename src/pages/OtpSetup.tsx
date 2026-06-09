import React, { useEffect, useState } from 'react';
import { useTranslation } from '../utilities/translation';
import { PopupMessage } from '../components/common/PopupMessage';
import { fetchOtpMessagesList, createUpdateOtpMessage, deleteOtpMessage, type OtpMessageItem } from '../utilities/api';

export default function OtpSetup() {
  const t = useTranslation();
  const [messages, setMessages] = useState<OtpMessageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form States
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<OtpMessageItem | null>(null);
  const [countyCode, setCountyCode] = useState<string>('BD');
  const [otpCode, setOtpCode] = useState<string>('CUSTOMER_REGISTRATION');
  const [otpMessage, setOtpMessage] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Custom Delete Confirm Modal States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteTargetUuid, setDeleteTargetUuid] = useState<string | null>(null);

  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false,
    type: 'success',
    message: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOtpMessagesList();
      setMessages(data);
    } catch (err: any) {
      console.error('Error fetching OTP messages:', err);
      setError(err.message || 'An error occurred while loading OTP messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditClick = (item: OtpMessageItem) => {
    setEditItem(item);
    setCountyCode(item.county_code_for_otp);
    setOtpCode(item.otp_code);
    setOtpMessage(item.otp_message);
    setStatus(item.status);
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditItem(null);
    setCountyCode('BD');
    setOtpCode('CUSTOMER_REGISTRATION');
    setOtpMessage('');
    setStatus('ACTIVE');
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpMessage.trim()) {
      setFormError('OTP message text is required');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        county_code_for_otp: countyCode,
        otp_code: otpCode,
        otp_message: otpMessage.trim(),
        status: status,
        uuid: editItem?.uuid
      };

      await createUpdateOtpMessage(payload);
      handleCloseModal();
      await loadData();

      setPopup({
        show: true,
        type: 'success',
        message: editItem ? 'OTP message updated successfully' : 'OTP message created successfully'
      });
    } catch (err: any) {
      console.error('Error saving OTP message:', err);
      setFormError(err.response?.data?.message || err.response?.data?.detail || err.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (uuid: string) => {
    setDeleteTargetUuid(uuid);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetUuid) return;
    try {
      setLoading(true);
      setShowDeleteConfirm(false);
      await deleteOtpMessage(deleteTargetUuid);
      setDeleteTargetUuid(null);
      await loadData();
      setPopup({
        show: true,
        type: 'success',
        message: 'OTP message deleted successfully'
      });
    } catch (err: any) {
      console.error('Error deleting OTP message:', err);
      setPopup({
        show: true,
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to delete OTP message'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0">


      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3">
          <div className="row align-items-center">
            <div className="col-sm-6">
              <h5 className="m-0 font-weight-bold text-primary">OTP Setup Messages</h5>
            </div>
            <div className="col-sm-6 text-right">
              <button
                type="button"
                className="btn btn-primary btn-sm rounded-pill px-3 py-2"
                onClick={() => {
                  setFormError(null);
                  setShowModal(true);
                }}
              >
                <i className="fa fa-plus mr-1"></i> Add OTP Message
              </button>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {loading && (
            <div className="p-5 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger m-3" role="alert">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="table-responsive">
              <table className="table table-striped table-hover w-100 m-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: '70px' }} className="text-center">{t('slNo')}</th>
                    <th>Country Code</th>
                    <th>OTP Trigger Code</th>
                    <th>OTP Message Template</th>
                    <th className="text-center">{t('status')}</th>
                    <th style={{ width: '150px' }} className="text-center">{t('actionLabel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted p-4">
                        No OTP setup messages found.
                      </td>
                    </tr>
                  ) : (
                    messages.map((item, index) => (
                      <tr key={item.uuid}>
                        <td className="text-center font-weight-bold text-muted">{index + 1}</td>
                        <td><span className="badge badge-secondary">{item.county_code_for_otp}</span></td>
                        <td><code>{item.otp_code}</code></td>
                        <td className="font-weight-bold text-dark">{item.otp_message}</td>
                        <td className="text-center">
                          {item.status === 'ACTIVE' ? (
                            <span className="badge badge-success px-2 py-1">{t('active') || 'Active'}</span>
                          ) : (
                            <span className="badge badge-secondary px-2 py-1">{t('inactive') || 'Inactive'}</span>
                          )}
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-xs mr-2 px-2 py-1"
                            onClick={() => handleEditClick(item)}
                          >
                            <i className="fa fa-edit mr-1"></i> {t('edit')}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-xs px-2 py-1"
                            onClick={() => handleDelete(item.uuid)}
                          >
                            <i className="fa fa-trash mr-1"></i> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit OTP Message Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
              <div className="modal-header bg-primary text-white border-0" style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                <h5 className="modal-title font-weight-bold">
                  {editItem ? 'Edit OTP Message' : 'Add OTP Message'}
                </h5>
                <button type="button" className="close text-white" onClick={handleCloseModal}>
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  {formError && (
                    <div className="alert alert-danger" role="alert">
                      <i className="fa fa-exclamation-triangle mr-2"></i>
                      {formError}
                    </div>
                  )}

                  <div className="row">
                    {/* Country Code */}
                    <div className="col-md-6 form-group">
                      <label className="font-weight-bold text-dark">Country Code *</label>
                      <select
                        className="form-control"
                        value={countyCode}
                        onChange={(e) => setCountyCode(e.target.value)}
                        required
                      >
                        <option value="BD">BD (Bangladesh)</option>
                        <option value="US">US (United States)</option>
                        <option value="GB">GB (United Kingdom)</option>
                        <option value="IN">IN (India)</option>
                      </select>
                    </div>

                    {/* OTP Trigger Code */}
                    <div className="col-md-6 form-group">
                      <label className="font-weight-bold text-dark">OTP Trigger Code *</label>
                      <select
                        className="form-control"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        required
                      >
                        <option value="CUSTOMER_REGISTRATION">CUSTOMER_REGISTRATION</option>
                        <option value="DRIVER_REGISTRATION">DRIVER_REGISTRATION</option>
                        <option value="LOGIN">LOGIN</option>
                        <option value="FORGET_PASSWORD">FORGET_PASSWORD</option>
                        <option value="WITHDRAW">WITHDRAW</option>
                        <option value="RIDE_START_OTP">RIDE_START_OTP</option>
                        <option value="BOOK_CONFIRM_OTP">BOOK_CONFIRM_OTP</option>
                        <option value="BOOK_CANCEL_OTP">BOOK_CANCEL_OTP</option>
                        <option value="BOOK_START_OTP">BOOK_START_OTP</option>
                        <option value="BOOK_END_OTP">BOOK_END_OTP</option>
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    {/* Status */}
                    <div className="col-md-6 form-group">
                      <label className="font-weight-bold text-dark">Status *</label>
                      <select
                        className="form-control"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        required
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    {/* OTP Message Text */}
                    <div className="col-12 form-group">
                      <label className="font-weight-bold text-dark">OTP Message Template *</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        placeholder="e.g., THIS IS CUSTOMER REG OTP: {otp_code}"
                        value={otpMessage}
                        onChange={(e) => setOtpMessage(e.target.value)}
                        required
                      />
                      <small className="form-text text-muted">
                        Use <code>{"{otp_code}"}</code> as a placeholder where the numeric OTP code should be injected.
                      </small>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light border-0" style={{ borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px' }}>
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={handleCloseModal} disabled={submitting}>
                    {t('cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={submitting}>
                    {submitting ? t('submitting') : (editItem ? 'Save Changes' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Popup alerts */}
      <PopupMessage
        show={popup.show}
        type={popup.type}
        message={popup.message}
        onClose={() => setPopup(prev => ({ ...prev, show: false }))}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: '400px' }}>
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                <div className="modal-header bg-danger text-white border-0" style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                  <h5 className="modal-title font-weight-bold">Confirm Delete</h5>
                  <button type="button" className="close text-white" onClick={() => { setShowDeleteConfirm(false); setDeleteTargetUuid(null); }}>
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body p-4 text-center">
                  <i className="fa fa-trash text-danger mb-3" style={{ fontSize: '48px' }}></i>
                  <p className="font-weight-bold text-dark mb-1">Are you sure you want to delete this OTP message?</p>
                  <p className="text-muted small">This action cannot be undone.</p>
                </div>
                <div className="modal-footer bg-light border-0 justify-content-center pb-3" style={{ borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary rounded-pill px-4 mr-2"
                    onClick={() => { setShowDeleteConfirm(false); setDeleteTargetUuid(null); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger rounded-pill px-4"
                    onClick={confirmDelete}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}
