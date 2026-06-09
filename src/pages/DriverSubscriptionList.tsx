import { useEffect, useState } from 'react';
import {
  fetchDriverSubscriptionList,
  fetchCarCategoryList,
  createOrUpdateDriverSubscription
} from '../utilities/api';
import type {
  DriverSubscriptionItem,
  CarCategoryItem
} from '../utilities/api';
import { useTranslation } from '../utilities/translation';
import { PopupMessage } from '../components/common/PopupMessage';

export default function DriverSubscriptionList() {
  const t = useTranslation();
  const [subscriptions, setSubscriptions] = useState<DriverSubscriptionItem[]>([]);
  const [carCategories, setCarCategories] = useState<CarCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<DriverSubscriptionItem | null>(null);
  const [subscriptionType, setSubscriptionType] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [previousPrice, setPreviousPrice] = useState<string>('');
  const [validateFor, setValidateFor] = useState<string>('');
  const [selectedCategoryUuid, setSelectedCategoryUuid] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Common popup
  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false,
    type: 'error',
    message: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [subsData, categoriesData] = await Promise.all([
        fetchDriverSubscriptionList(),
        fetchCarCategoryList()
      ]);
      setSubscriptions(subsData);
      setCarCategories(categoriesData);
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

  const handleEditClick = (item: DriverSubscriptionItem) => {
    setEditItem(item);
    setSubscriptionType(item.subscription_type);
    setPrice(item.price.toString());
    setPreviousPrice(item.previous_price.toString());
    setValidateFor(item.validate_for.toString());
    setStatus(item.status);
    // Since item response doesn't explicitly return car_categories_uuid, default to first category if not available
    setSelectedCategoryUuid((item as any).car_categories_uuid || (carCategories[0]?.uuid || ''));
    setFormError(null);
    setShowModal(true);
  };

  const handleAddClick = () => {
    setEditItem(null);
    setSubscriptionType('REGISTRATION_PACKAGE');
    setPrice('');
    setPreviousPrice('');
    setValidateFor('');
    setStatus('ACTIVE');
    setSelectedCategoryUuid(carCategories[0]?.uuid || '');
    setFormError(null);
    setShowModal(true);
  };

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

      const payload = {
        subscription_type: subscriptionType.trim(),
        price: Number(price),
        previous_price: Number(previousPrice),
        validate_for: Number(validateFor),
        car_categories_uuid: selectedCategoryUuid,
        status: status,
        ...(editItem ? { uuid: editItem.uuid } : {})
      };

      const successMessage = await createOrUpdateDriverSubscription(payload);

      setShowModal(false);
      await loadData();

      setPopup({
        show: true,
        type: 'success',
        message: successMessage
      });
    } catch (err: any) {
      console.error('Error saving subscription:', err);
      setFormError(err.response?.data?.message || err.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const query = searchQuery.toLowerCase();
    return (
      sub.subscription_type.toLowerCase().includes(query) ||
      sub.status.toLowerCase().includes(query) ||
      sub.uuid.toLowerCase().includes(query) ||
      sub.price.toString().includes(query)
    );
  });

  return (
    <div className="card w-100">
      <div className="card-header">
        <div className="d-flex align-items-center justify-content-between flex-wrap w-100" style={{ gap: '15px' }}>
          <div className="d-flex align-items-center flex-wrap" style={{ gap: '15px' }}>
            <h3 className="card-title m-0">{t('driverSubscription')} List</h3>
            <div className="input-group input-group-sm" style={{ width: '250px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search subscriptions..."
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
              className="btn btn-primary btn-sm"
              onClick={handleAddClick}
            >
              <i className="fa fa-plus mr-1"></i> Add Subscription
            </button>
            <button
              type="button"
              className="btn btn-default btn-sm"
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
          <div className="p-4 text-center">
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
            <table className="table table-striped table-hover w-100 m-0">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>SL No</th>
                  <th>UUID</th>
                  <th>Subscription Type</th>
                  <th>Price</th>
                  <th>Previous Price</th>
                  <th>Validate For (Days)</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((item, index) => (
                  <tr key={item.uuid}>
                    <td>{index + 1}</td>
                    <td><code>{item.uuid}</code></td>
                    <td>
                      <span className="badge badge-primary font-weight-bold">
                        {item.subscription_type}
                      </span>
                    </td>
                    <td className="text-success font-weight-bold">৳{item.price.toFixed(2)}</td>
                    <td className="text-muted text-decoration-line-through">
                      <del>৳{item.previous_price.toFixed(2)}</del>
                    </td>
                    <td>{item.validate_for}</td>
                    <td>
                      <span className={`badge ${item.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{new Date(item.created_at).toLocaleString()}</td>
                    <td>{new Date(item.updated_at).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEditClick(item)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredSubscriptions.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center p-3 text-muted">
                      No driver subscriptions match the search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Subscription Modal */}
      {showModal && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editItem ? 'Edit Driver Subscription' : 'Add Driver Subscription'}
                  </h5>
                  <button type="button" className="close" onClick={() => setShowModal(false)}>
                    <span>&times;</span>
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    {formError && (
                      <div className="alert alert-danger mb-3" role="alert">
                        {formError}
                      </div>
                    )}

                     {/* Subscription Type */}
                    <div className="form-group">
                      <label className="font-weight-bold">Subscription Type *</label>
                      <select
                        className="form-control"
                        value={subscriptionType}
                        onChange={(e) => setSubscriptionType(e.target.value)}
                        required
                      >
                        <option value="REGISTRATION_PACKAGE">REGISTRATION_PACKAGE</option>
                        <option value="BASIC">BASIC</option>
                        <option value="STANDARD">STANDARD</option>
                        <option value="SAVING">SAVING</option>
                        <option value="SUPER_SAVING">SUPER_SAVING</option>
                      </select>
                    </div>

                    {/* Price & Previous Price */}
                    <div className="row">
                      <div className="col-md-6 form-group">
                        <label className="font-weight-bold">Price *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          placeholder="0.00"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-6 form-group">
                        <label className="font-weight-bold">Previous Price *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          placeholder="0.00"
                          value={previousPrice}
                          onChange={(e) => setPreviousPrice(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Validate For & Car Category */}
                    <div className="row">
                      <div className="col-md-6 form-group">
                        <label className="font-weight-bold">Validate For (Days) *</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 30"
                          value={validateFor}
                          onChange={(e) => setValidateFor(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-6 form-group">
                        <label className="font-weight-bold">Car Category *</label>
                        <select
                          className="form-control"
                          value={selectedCategoryUuid}
                          onChange={(e) => setSelectedCategoryUuid(e.target.value)}
                          required
                        >
                          <option value="">Select Category</option>
                          {carCategories.map((cat) => (
                            <option key={cat.uuid} value={cat.uuid}>
                              {cat.car_type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="form-group mt-3">
                      <label className="font-weight-bold">Status *</label>
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
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      <PopupMessage
        show={popup.show}
        type={popup.type}
        message={popup.message}
        onClose={() => setPopup(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}
