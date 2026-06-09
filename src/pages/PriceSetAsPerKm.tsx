import { useEffect, useState } from 'react';
import {
  fetchPriceSetAsPerKmList,
  fetchCarServiceCategoryList,
  createOrUpdatePriceSetAsPerKm,
  deletePriceSetAsPerKm
} from '../utilities/api';
import type {
  PriceSetAsPerKmItem,
  CarServiceCategoryItem
} from '../utilities/api';
import { useTranslation } from '../utilities/translation';
import { PopupMessage } from '../components/common/PopupMessage';

export default function PriceSetAsPerKm() {
  const t = useTranslation();
  const [prices, setPrices] = useState<PriceSetAsPerKmItem[]>([]);
  const [serviceCategories, setServiceCategories] = useState<CarServiceCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<PriceSetAsPerKmItem | null>(null);
  const [selectedServiceCategoryUuid, setSelectedServiceCategoryUuid] = useState<string>('');
  const [pricePerKm, setPricePerKm] = useState<string>('');
  const [minimumBookingPrice, setMinimumBookingPrice] = useState<string>('');
  const [waitingTime, setWaitingTime] = useState<string>('');
  const [waitingPrice, setWaitingPrice] = useState<string>('');
  const [cancellationFee, setCancellationFee] = useState<string>('');
  const [busyStartTime, setBusyStartTime] = useState<string>('08:00:00');
  const [busyEndTime, setBusyEndTime] = useState<string>('10:30:00');
  const [busyTimePricePercentage, setBusyTimePricePercentage] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('BD');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Success / error popup
  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false,
    type: 'error',
    message: ''
  });

  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteTargetUuid, setDeleteTargetUuid] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pricesData, categoriesData] = await Promise.all([
        fetchPriceSetAsPerKmList(),
        fetchCarServiceCategoryList()
      ]);
      setPrices(pricesData);
      setServiceCategories(categoriesData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddClick = () => {
    setEditItem(null);
    setSelectedServiceCategoryUuid(serviceCategories[0]?.uuid || '');
    setPricePerKm('');
    setMinimumBookingPrice('');
    setWaitingTime('');
    setWaitingPrice('');
    setCancellationFee('');
    setBusyStartTime('08:00:00');
    setBusyEndTime('10:30:00');
    setBusyTimePricePercentage('');
    setCountryCode('BD');
    setStatus('ACTIVE');
    setFormError(null);
    setShowModal(true);
  };

  const handleEditClick = (item: PriceSetAsPerKmItem) => {
    setEditItem(item);
    setSelectedServiceCategoryUuid(item.car_service_category?.uuid || (serviceCategories[0]?.uuid || ''));
    setPricePerKm(item.price_per_km.toString());
    setMinimumBookingPrice(item.minimum_booking_price.toString());
    setWaitingTime(item.waiting_time.toString());
    setWaitingPrice(item.waiting_price.toString());
    setCancellationFee(item.cancellation_fee.toString());
    setBusyStartTime(item.busy_start_time || '08:00:00');
    setBusyEndTime(item.busy_end_time || '10:30:00');
    setBusyTimePricePercentage(item.busy_time_price_percentage.toString());
    setCountryCode(item.country_code || 'BD');
    setStatus(item.status || 'ACTIVE');
    setFormError(null);
    setShowModal(true);
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
      const msg = await deletePriceSetAsPerKm(deleteTargetUuid);
      setDeleteTargetUuid(null);
      await loadData();
      setPopup({
        show: true,
        type: 'success',
        message: msg || 'Deleted successfully'
      });
    } catch (err: any) {
      console.error('Error deleting price set:', err);
      setDeleteTargetUuid(null);
      setPopup({
        show: true,
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to delete price set'
      });
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceCategoryUuid) {
      setFormError('Car Service Category is required');
      return;
    }
    if (!pricePerKm || isNaN(Number(pricePerKm))) {
      setFormError('Price per KM must be a valid number');
      return;
    }
    if (!minimumBookingPrice || isNaN(Number(minimumBookingPrice))) {
      setFormError('Minimum booking price must be a valid number');
      return;
    }
    if (!waitingTime || isNaN(Number(waitingTime))) {
      setFormError('Waiting time must be a valid number');
      return;
    }
    if (!waitingPrice || isNaN(Number(waitingPrice))) {
      setFormError('Waiting price must be a valid number');
      return;
    }
    if (!cancellationFee || isNaN(Number(cancellationFee))) {
      setFormError('Cancellation fee must be a valid number');
      return;
    }
    if (!busyStartTime.trim() || !busyEndTime.trim()) {
      setFormError('Busy hours start/end times are required');
      return;
    }
    if (!busyTimePricePercentage || isNaN(Number(busyTimePricePercentage))) {
      setFormError('Busy time price percentage must be a valid number');
      return;
    }
    if (!countryCode.trim()) {
      setFormError('Country code is required');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const successMessage = await createOrUpdatePriceSetAsPerKm({
        price_per_km: Number(pricePerKm),
        minimum_booking_price: Number(minimumBookingPrice),
        waiting_time: Number(waitingTime),
        waiting_price: Number(waitingPrice),
        cancellation_fee: Number(cancellationFee),
        busy_start_time: busyStartTime.trim(),
        busy_end_time: busyEndTime.trim(),
        busy_time_price_percentage: Number(busyTimePricePercentage),
        country_code: countryCode.trim(),
        car_service_category_uuid: selectedServiceCategoryUuid,
        status: status,
        ...(editItem ? { uuid: editItem.uuid } : {})
      });

      setShowModal(false);
      await loadData();

      setPopup({
        show: true,
        type: 'success',
        message: successMessage
      });
    } catch (err: any) {
      console.error('Error saving price set:', err);
      setFormError(err.response?.data?.message || err.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPrices = prices.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      (item.car_service_category?.service_name || '').toLowerCase().includes(query) ||
      (item.car_service_category?.car_category?.car_type || '').toLowerCase().includes(query) ||
      item.uuid.toLowerCase().includes(query) ||
      item.country_code.toLowerCase().includes(query)
    );
  });

  return (
    <div className="card w-100 shadow-sm border-0">
      <div className="card-header bg-white py-3">
        <div className="d-flex align-items-center justify-content-between flex-wrap w-100" style={{ gap: '15px' }}>
          <div className="d-flex align-items-center flex-wrap" style={{ gap: '15px' }}>
            <h3 className="card-title m-0 font-weight-bold text-dark">{t('priceSetAsPerKm')} List</h3>
            <div className="input-group input-group-sm" style={{ width: '250px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search prices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="input-group-append">
                <button type="button" className="btn btn-default">
                  <i className="fa fa-search"></i>
                </button>
              </div>
            </div>
          </div>
          <div className="card-tools d-flex" style={{ gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm rounded-pill px-3"
              onClick={handleAddClick}
            >
              <i className="fa fa-plus mr-1"></i> Add Price Set
            </button>
            <button
              type="button"
              className="btn btn-default btn-sm rounded-pill px-3"
              onClick={loadData}
              disabled={loading}
            >
              <i className="fa fa-refresh mr-1"></i> Refresh
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
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>SL No</th>
                  <th>Service Category</th>
                  <th>Price/Km</th>
                  <th>Min Booking</th>
                  <th>Waiting (Min/Price)</th>
                  <th>Cancel Fee</th>
                  <th>Busy Hours (Start - End)</th>
                  <th>Busy Charge (%)</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrices.map((item, index) => (
                  <tr key={item.uuid}>
                    <td>{index + 1}</td>
                    <td>
                      {item.car_service_category ? (
                        <div>
                          <span className="font-weight-bold text-dark d-block">
                            {item.car_service_category.service_name}
                          </span>
                          <span className="small text-muted">
                            Car Category: {item.car_service_category.car_category?.car_type || 'None'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted">None</span>
                      )}
                    </td>
                    <td className="text-success font-weight-bold">৳{item.price_per_km.toFixed(2)}</td>
                    <td>৳{item.minimum_booking_price.toFixed(2)}</td>
                    <td>
                      <div>
                        <span className="d-block text-dark">{item.waiting_time} mins</span>
                        <span className="small text-muted">৳{item.waiting_price}/min</span>
                      </div>
                    </td>
                    <td>৳{item.cancellation_fee.toFixed(2)}</td>
                    <td>
                      {item.busy_start_time} - {item.busy_end_time}
                    </td>
                    <td>
                      <span className="badge badge-warning text-dark font-weight-bold">
                        {item.busy_time_price_percentage}%
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-secondary">{item.country_code}</span>
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        {item.status ?? 'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex" style={{ gap: '5px' }}>
                        <button
                          className="btn btn-xs btn-outline-primary"
                          onClick={() => handleEditClick(item)}
                        >
                          <i className="fa fa-edit mr-1"></i> Edit
                        </button>
                        <button
                          className="btn btn-xs btn-outline-danger"
                          onClick={() => handleDeleteClick(item.uuid)}
                        >
                          <i className="fa fa-trash mr-1"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPrices.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center p-4 text-muted">
                      No price configurations match the search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040, overflowY: 'auto' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                <div className="modal-header bg-primary text-white border-0" style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                  <h5 className="modal-title font-weight-bold">
                    {editItem ? 'Edit Price Set' : 'Add Price Set'}
                  </h5>
                  <button type="button" className="close text-white" onClick={() => setShowModal(false)}>
                    <span>&times;</span>
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4">
                    {formError && (
                      <div className="alert alert-danger mb-3" role="alert">
                        <i className="fa fa-exclamation-triangle mr-2"></i>
                        {formError}
                      </div>
                    )}

                    <div className="row">
                      {/* Car Service Category */}
                      <div className="col-md-6 form-group">
                        <label className="font-weight-bold text-dark">Car Service Category *</label>
                        <select
                          className="form-control"
                          value={selectedServiceCategoryUuid}
                          onChange={(e) => setSelectedServiceCategoryUuid(e.target.value)}
                          required
                        >
                          <option value="">Select Service Category</option>
                          {serviceCategories.map((sc) => (
                            <option key={sc.uuid} value={sc.uuid}>
                              {sc.service_name} (Car Type: {sc.car_category?.car_type || 'None'})
                            </option>
                          ))}
                        </select>
                      </div>

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
                      {/* Price Per KM */}
                      <div className="col-md-6 form-group">
                        <label className="font-weight-bold text-dark">Price Per KM *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          placeholder="e.g. 15.00"
                          value={pricePerKm}
                          onChange={(e) => setPricePerKm(e.target.value)}
                          required
                        />
                      </div>

                      {/* Minimum Booking Price */}
                      <div className="col-md-6 form-group">
                        <label className="font-weight-bold text-dark">Minimum Booking Price *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          placeholder="e.g. 100.00"
                          value={minimumBookingPrice}
                          onChange={(e) => setMinimumBookingPrice(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="row">
                      {/* Waiting Time */}
                      <div className="col-md-6 form-group">
                        <label className="font-weight-bold text-dark">Waiting Time (Minutes) *</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 10"
                          value={waitingTime}
                          onChange={(e) => setWaitingTime(e.target.value)}
                          required
                        />
                      </div>

                      {/* Waiting Price */}
                      <div className="col-md-6 form-group">
                        <label className="font-weight-bold text-dark">Waiting Price (Per Min) *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          placeholder="e.g. 1.50"
                          value={waitingPrice}
                          onChange={(e) => setWaitingPrice(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="row">
                      {/* Cancellation Fee */}
                      <div className="col-md-6 form-group">
                        <label className="font-weight-bold text-dark">Cancellation Fee *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          placeholder="e.g. 50.00"
                          value={cancellationFee}
                          onChange={(e) => setCancellationFee(e.target.value)}
                          required
                        />
                      </div>

                      {/* Country Code */}
                      <div className="col-md-6 form-group">
                        <label className="font-weight-bold text-dark">Country Code *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. BD"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="row">
                      {/* Busy Start Time */}
                      <div className="col-md-4 form-group">
                        <label className="font-weight-bold text-dark">Busy Start Time (HH:MM:SS) *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. 08:00:00"
                          value={busyStartTime}
                          onChange={(e) => setBusyStartTime(e.target.value)}
                          required
                        />
                      </div>

                      {/* Busy End Time */}
                      <div className="col-md-4 form-group">
                        <label className="font-weight-bold text-dark">Busy End Time (HH:MM:SS) *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. 10:30:00"
                          value={busyEndTime}
                          onChange={(e) => setBusyEndTime(e.target.value)}
                          required
                        />
                      </div>

                      {/* Busy Time Price Percentage */}
                      <div className="col-md-4 form-group">
                        <label className="font-weight-bold text-dark">Busy Time Price Percentage (%) *</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 10"
                          value={busyTimePricePercentage}
                          onChange={(e) => setBusyTimePricePercentage(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light border-0" style={{ borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary rounded-pill px-4"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1030 }}></div>
        </>
      )}

      <PopupMessage
        show={popup.show}
        type={popup.type}
        message={popup.message}
        onClose={() => setPopup(prev => ({ ...prev, show: false }))}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                <div className="modal-header bg-danger text-white border-0" style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                  <h5 className="modal-title font-weight-bold">Confirm Delete</h5>
                  <button type="button" className="close text-white" onClick={() => { setShowDeleteConfirm(false); setDeleteTargetUuid(null); }}>
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body p-4 text-center">
                  <i className="fa fa-exclamation-triangle text-danger mb-3" style={{ fontSize: '48px' }}></i>
                  <p className="lead font-weight-normal text-dark mb-0">Are you sure you want to delete this price set?</p>
                  <p className="text-muted small mt-2">This action cannot be undone.</p>
                </div>
                <div className="modal-footer bg-light border-0" style={{ borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary rounded-pill px-4"
                    onClick={() => { setShowDeleteConfirm(false); setDeleteTargetUuid(null); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger rounded-pill px-4"
                    onClick={confirmDelete}
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1030 }}></div>
        </>
      )}
    </div>
  );
}
