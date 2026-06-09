import { useEffect, useState } from 'react';
import {
  fetchCarServiceCategoryList,
  fetchCarCategoryList,
  createOrUpdateCarServiceCategory,
  deleteCarServiceCategory,
  newwork_image_url
} from '../utilities/api';
import type {
  CarServiceCategoryItem,
  CarCategoryItem
} from '../utilities/api';
import { useTranslation } from '../utilities/translation';
import noImage from '../assets/no-image.png';
import { PopupMessage } from '../components/common/PopupMessage';

export default function CarServiceCategoryList() {
  const t = useTranslation();
  const [serviceCategories, setServiceCategories] = useState<CarServiceCategoryItem[]>([]);
  const [carCategories, setCarCategories] = useState<CarCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Form states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<CarServiceCategoryItem | null>(null);
  const [serviceName, setServiceName] = useState<string>('');
  const [selectedCategoryUuid, setSelectedCategoryUuid] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [serviceAvatar, setServiceAvatar] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Success / error popup
  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false,
    type: 'error',
    message: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [serviceData, categoryData] = await Promise.all([
        fetchCarServiceCategoryList(),
        fetchCarCategoryList()
      ]);
      setServiceCategories(serviceData);
      setCarCategories(categoryData);
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
    setServiceName('INTER_CITY_RENTER');
    setSelectedCategoryUuid(carCategories[0]?.uuid || '');
    setStatus('ACTIVE');
    setServiceAvatar(null);
    setFormError(null);
    setShowModal(true);
  };

  const handleEditClick = (item: CarServiceCategoryItem) => {
    setEditItem(item);
    setServiceName(item.service_name);
    setSelectedCategoryUuid(item.car_category?.uuid || (carCategories[0]?.uuid || ''));
    setStatus(item.status || 'ACTIVE');
    setServiceAvatar(null);
    setFormError(null);
    setShowModal(true);
  };

  const handleDeleteClick = async (uuid: string) => {
    if (!window.confirm('Are you sure you want to delete this service category?')) {
      return;
    }

    try {
      setLoading(true);
      const msg = await deleteCarServiceCategory(uuid);
      await loadData();
      setPopup({
        show: true,
        type: 'success',
        message: msg || 'Deleted successfully'
      });
    } catch (err: any) {
      console.error('Error deleting service category:', err);
      setPopup({
        show: true,
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to delete service category'
      });
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      setFormError('Service Name is required');
      return;
    }
    if (!selectedCategoryUuid) {
      setFormError('Please select a Car Category');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const successMessage = await createOrUpdateCarServiceCategory({
        service_name: serviceName.trim(),
        car_category_uuid: selectedCategoryUuid,
        status: status,
        service_avatar: serviceAvatar,
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
      console.error('Error saving service category:', err);
      setFormError(err.response?.data?.message || err.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = serviceCategories.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.service_name.toLowerCase().includes(query) ||
      item.uuid.toLowerCase().includes(query) ||
      (item.car_category?.car_type || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="card w-100 shadow-sm border-0">
      <div className="card-header bg-white py-3">
        <div className="d-flex align-items-center justify-content-between flex-wrap w-100" style={{ gap: '15px' }}>
          <div className="d-flex align-items-center flex-wrap" style={{ gap: '15px' }}>
            <h3 className="card-title m-0 font-weight-bold text-dark">{t('carServiceCategory')} List</h3>
            <div className="input-group input-group-sm" style={{ width: '250px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search service categories..."
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
              <i className="fa fa-plus mr-1"></i> Add Service Category
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
                  <th>UUID</th>
                  <th>Avatar</th>
                  <th>Service Name</th>
                  <th>Car Category</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((item, index) => {
                  const avatarUrl = item.avatar
                    ? (item.avatar.startsWith('http') ? item.avatar : `${newwork_image_url}${item.avatar}`)
                    : noImage;

                  return (
                    <tr key={item.uuid}>
                      <td>{index + 1}</td>
                      <td><code>{item.uuid}</code></td>
                      <td>
                        <img
                          src={avatarUrl}
                          alt={item.service_name}
                          className="img-circle elevation-1 border"
                          style={{ width: '36px', height: '36px', objectFit: 'cover', cursor: 'pointer' }}
                          title="Click to view"
                          onClick={() => setPreviewImage({ url: avatarUrl, title: item.service_name })}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = noImage;
                          }}
                        />
                      </td>
                      <td>
                        <span className="font-weight-bold text-dark">{item.service_name}</span>
                      </td>
                      <td>
                        {item.car_category ? (
                          <span className="badge badge-primary font-weight-bold" style={{ fontSize: '12px' }}>
                            {item.car_category.car_type}
                          </span>
                        ) : (
                          <span className="text-muted">None</span>
                        )}
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
                  );
                })}
                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center p-4 text-muted">
                      No car service categories match the search query.
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
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                <div className="modal-header bg-primary text-white border-0" style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                  <h5 className="modal-title font-weight-bold">
                    {editItem ? 'Edit Service Category' : 'Add Service Category'}
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

                    {/* Service Name */}
                    <div className="form-group">
                      <label className="font-weight-bold text-dark">Service Name *</label>
                      <select
                        className="form-control"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        required
                      >
                        <option value="INTER_CITY_RENTER">INTER_CITY_RENTER</option>
                        <option value="WEDDING_CAR">WEDDING_CAR</option>
                        <option value="HOURLY">HOURLY</option>
                        <option value="AIRPORT_RENTER">AIRPORT_RENTER</option>
                        <option value="RETURN">RETURN</option>
                        <option value="OUTSTATION_RIDE">OUTSTATION_RIDE</option>
                        <option value="PACKAGE_DELIVERY">PACKAGE_DELIVERY</option>
                        <option value="RIDE_SHARE">RIDE_SHARE</option>
                      </select>
                    </div>

                    {/* Car Category Selection */}
                    <div className="form-group">
                      <label className="font-weight-bold text-dark">Car Category *</label>
                      <select
                        className="form-control"
                        value={selectedCategoryUuid}
                        onChange={(e) => setSelectedCategoryUuid(e.target.value)}
                        required
                      >
                        <option value="">Select Category</option>
                        {carCategories.map((cat) => (
                          <option key={cat.uuid} value={cat.uuid}>
                            {cat.car_type} (Capacity: {cat.set_capacity})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div className="form-group">
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

                    {/* Service Avatar Image Upload */}
                    <div className="form-group">
                      <label className="font-weight-bold text-dark">Service Avatar</label>
                      {serviceAvatar ? (
                        <div className="mb-2">
                          <span className="text-success d-block small mb-1">Selected Image Preview:</span>
                          <img
                            src={URL.createObjectURL(serviceAvatar)}
                            alt="Selected Preview"
                            className="img-thumbnail"
                            style={{ height: '60px', objectFit: 'contain' }}
                          />
                          <span className="d-block small text-muted mt-1">{serviceAvatar.name}</span>
                        </div>
                      ) : editItem && editItem.avatar ? (
                        <div className="mb-2">
                          <span className="text-muted d-block small mb-1">Current Image:</span>
                          <img
                            src={editItem.avatar.startsWith('http') ? editItem.avatar : `${newwork_image_url}${editItem.avatar}`}
                            alt="Current Avatar"
                            className="img-thumbnail"
                            style={{ height: '60px', objectFit: 'contain' }}
                          />
                        </div>
                      ) : null}
                      <input
                        type="file"
                        className="form-control-file border p-2 w-100 rounded"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setServiceAvatar(e.target.files[0]);
                          }
                        }}
                      />
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

      {/* Preview Image Modal */}
      {previewImage && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}
          onClick={() => setPreviewImage(null)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
              <div className="modal-header bg-dark text-white border-0" style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                <h5 className="modal-title font-weight-bold">{previewImage.title}</h5>
                <button type="button" className="close text-white" onClick={() => setPreviewImage(null)}>
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body p-0 text-center bg-light" style={{ borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px', overflow: 'hidden' }}>
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                />
              </div>
            </div>
          </div>
        </div>
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
