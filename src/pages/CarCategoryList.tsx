import { useEffect, useState } from 'react';
import { fetchCarCategoryList, newwork_image_url, createOrUpdateCarCategory, deleteCarCategory } from '../utilities/api';
import type { CarCategoryItem } from '../utilities/api';
import { useTranslation } from '../utilities/translation';
import noImage from '../assets/no-image.png';
import { PopupMessage } from '../components/common/PopupMessage';

export default function CarCategoryList() {
  const t = useTranslation();
  const [categories, setCategories] = useState<CarCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Form states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<CarCategoryItem | null>(null);
  const [carType, setCarType] = useState<string>('');
  const [setCapacity, setSetCapacity] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [carAvatar, setCarAvatar] = useState<File | null>(null);
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
      const data = await fetchCarCategoryList();
      setCategories(data);
    } catch (err: any) {
      console.error('Error loading car categories:', err);
      setError(err.message || 'An error occurred while loading car categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddClick = () => {
    setEditItem(null);
    setCarType('SEDAN');
    setSetCapacity('');
    setStatus('ACTIVE');
    setCarAvatar(null);
    setFormError(null);
    setShowModal(true);
  };

  const handleEditClick = (item: CarCategoryItem) => {
    setEditItem(item);
    setCarType(item.car_type);
    setSetCapacity(item.set_capacity ? item.set_capacity.toString() : '');
    setStatus(item.status || 'ACTIVE');
    setCarAvatar(null);
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
      const msg = await deleteCarCategory(deleteTargetUuid);
      setDeleteTargetUuid(null);
      await loadData();
      setPopup({
        show: true,
        type: 'success',
        message: msg || 'Deleted successfully'
      });
    } catch (err: any) {
      console.error('Error deleting car category:', err);
      setDeleteTargetUuid(null);
      setPopup({
        show: true,
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to delete car category'
      });
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carType.trim()) {
      setFormError('Car Type is required');
      return;
    }
    if (!setCapacity || isNaN(Number(setCapacity))) {
      setFormError('Valid Seat Capacity is required');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const successMessage = await createOrUpdateCarCategory({
        car_type: carType.trim(),
        set_capacity: Number(setCapacity),
        status: status,
        car_avatar: carAvatar,
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
      console.error('Error saving car category:', err);
      setFormError(err.response?.data?.message || err.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const query = searchQuery.toLowerCase();
    return (
      cat.car_type.toLowerCase().includes(query) ||
      cat.uuid.toLowerCase().includes(query) ||
      cat.id.toString().includes(query)
    );
  });

  return (
    <div className="card w-100">
      <div className="card-header">
        <div className="d-flex align-items-center justify-content-between flex-wrap w-100" style={{ gap: '15px' }}>
          <div className="d-flex align-items-center flex-wrap" style={{ gap: '15px' }}>
            <h3 className="card-title m-0">{t('carCategory')} List</h3>
            <div className="input-group input-group-sm" style={{ width: '250px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search categories..."
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
              <i className="fa fa-plus mr-1"></i> Add Category
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
                  <th>Image</th>
                  <th>Car Type</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((item, index) => {
                  const avatarUrl = item.car_avatar
                    ? (item.car_avatar.startsWith('http') ? item.car_avatar : `${newwork_image_url}${item.car_avatar}`)
                    : noImage;

                  return (
                    <tr key={item.uuid}>
                      <td>{index + 1}</td>
                      <td><code>{item.uuid}</code></td>
                      <td>
                        <img
                          src={avatarUrl}
                          alt={item.car_type}
                          className="img-circle elevation-1 border"
                          style={{ width: '36px', height: '36px', objectFit: 'cover', cursor: 'pointer' }}
                          title="Click to view"
                          onClick={() => setPreviewImage({ url: avatarUrl, title: item.car_type })}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = noImage;
                          }}
                        />
                      </td>
                      <td>
                        <span className="badge badge-primary font-weight-bold" style={{ fontSize: '14px' }}>
                          {item.car_type}
                        </span>
                      </td>
                      <td>{item.set_capacity ?? 'N/A'}</td>
                      <td>
                        <span className={`badge ${item.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                          {item.status ?? 'ACTIVE'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex" style={{ gap: '5px' }}>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditClick(item)}
                          >
                            <i className="fa fa-edit mr-1"></i> Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
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
                    <td colSpan={7} className="text-center p-3 text-muted">
                      No car categories match the search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {showModal && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                <div className="modal-header bg-primary text-white border-0" style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                  <h5 className="modal-title font-weight-bold">
                    {editItem ? 'Edit Car Category' : 'Add Car Category'}
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

                    {/* Car Type */}
                    <div className="form-group">
                      <label className="font-weight-bold text-dark">Car Type *</label>
                      <select
                        className="form-control"
                        value={carType}
                        onChange={(e) => setCarType(e.target.value)}
                        required
                      >
                        <option value="SEDAN">SEDAN</option>
                        <option value="SEDAN_PREMIUM">SEDAN_PREMIUM</option>
                        <option value="SEDAN_ECONOMY">SEDAN_ECONOMY</option>
                        <option value="CHANDER_GARI">CHANDER_GARI</option>
                        <option value="NOAH">NOAH</option>
                        <option value="HIACE">HIACE</option>
                        <option value="CONVERTIBLE">CONVERTIBLE</option>
                        <option value="COUPE">COUPE</option>
                        <option value="WAGON">WAGON</option>
                        <option value="VAN">VAN</option>
                        <option value="JEEP">JEEP</option>
                        <option value="TRUCK">TRUCK</option>
                        <option value="MOTOR_CYCLE">MOTOR_CYCLE</option>
                        <option value="MOTOR_CYCLE_SAVER">MOTOR_CYCLE_SAVER</option>
                      </select>
                    </div>

                    {/* Set Capacity */}
                    <div className="form-group">
                      <label className="font-weight-bold text-dark">Seat Capacity *</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 4"
                        value={setCapacity}
                        onChange={(e) => setSetCapacity(e.target.value)}
                        required
                      />
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

                     {/* Car Avatar Image Upload */}
                    <div className="form-group">
                      <label className="font-weight-bold text-dark">Car Avatar Image</label>
                      {carAvatar ? (
                        <div className="mb-2">
                          <span className="text-success d-block small mb-1">Selected Image Preview:</span>
                          <img
                            src={URL.createObjectURL(carAvatar)}
                            alt="Selected Preview"
                            className="img-thumbnail"
                            style={{ height: '60px', objectFit: 'contain' }}
                          />
                          <span className="d-block small text-muted mt-1">{carAvatar.name}</span>
                        </div>
                      ) : editItem && editItem.car_avatar ? (
                        <div className="mb-2">
                          <span className="text-muted d-block small mb-1">Current Image:</span>
                          <img
                            src={editItem.car_avatar.startsWith('http') ? editItem.car_avatar : `${newwork_image_url}${editItem.car_avatar}`}
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
                            setCarAvatar(e.target.files[0]);
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
                  <p className="lead font-weight-normal text-dark mb-0">Are you sure you want to delete this category?</p>
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
