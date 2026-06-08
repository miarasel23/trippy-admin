import React, { useEffect, useState } from 'react';
import { fetchActionList, createAction, editAction } from '../utilities/api';
import { PopupMessage } from '../components/common/PopupMessage';
import type { ActionItem } from '../store/action';

export default function ActionList() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Global error for create action duplicate
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Search and Sort states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'id' | 'action_when'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal / Add Form states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formActionWhen, setFormActionWhen] = useState<string>('');
  const [editUuid, setEditUuid] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Common popup for API success/error messages
  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'error', message: '' });

  const loadActions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchActionList();
      setActions(data);
    } catch (err: any) {
      console.error('Error fetching action list:', err);
      setError(err.message || 'An error occurred while fetching actions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
  }, []);

  const handleSort = (field: 'id' | 'action_when') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formActionWhen.trim()) {
      setFormError('Action When is required');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      if (editUuid) {
        // Editing existing action
        await editAction({ uuid: editUuid, action_when: formActionWhen.trim() });
      } else {
        // Creating new action
        await createAction({ action_when: formActionWhen.trim() });
      }
      // Reset form and close modal
      setFormActionWhen('');
      setEditUuid(null);
      setShowModal(false);
      // Refresh list
      await loadActions();
      // Clear any previous global error
      setGlobalError(null);
      // Show success popup
      setPopup({ show: true, type: 'success', message: editUuid ? 'Action updated successfully' : 'Action added successfully' });
    } catch (err: any) {
      console.error('Error processing action:', err);
      const apiMessage = err?.response?.data?.message || err.message || 'Failed to process action';
      setGlobalError(apiMessage);
      setFormError(apiMessage);
      // Show error popup
      setPopup({ show: true, type: 'error', message: apiMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (item: ActionItem) => {
    setEditUuid(item.uuid);
    setFormActionWhen(item.action_when);
    setFormError(null);
    setShowModal(true);
  };

  // Filter actions based on search query
  const filteredActions = actions.filter((item) =>
    item.action_when.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.uuid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.id.toString().includes(searchQuery)
  );

  // Sort filtered actions
  const sortedActions = [...filteredActions].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'id') {
      comparison = a.id - b.id;
    } else if (sortField === 'action_when') {
      comparison = a.action_when.localeCompare(b.action_when);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="card w-100">
      <div className="card-header">
        <div className="d-flex align-items-center justify-content-between flex-wrap w-100" style={{ gap: '15px' }}>
          <div className="d-flex align-items-center flex-wrap" style={{ gap: '15px' }}>
            <h3 className="card-title m-0">Action List</h3>
            <div className="input-group input-group-sm" style={{ width: '250px' }}>
              <input
                type="text"
                name="table_search"
                className="form-control"
                placeholder="Search actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="input-group-append">
                <button type="submit" className="btn btn-default">
                  <i className="fa fa-search"></i>
                </button>
              </div>
            </div>
          </div>
          <div className="card-tools">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setFormError(null);
                setShowModal(true);
              }}
            >
              <i className="fa fa-plus mr-1"></i> Add Action
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
          <table className="table table-striped table-hover w-100 m-0">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>SL No</th>
                <th>UUID</th>
                <th
                  onClick={() => handleSort('action_when')}
                  style={{ cursor: 'pointer' }}
                  className="unselectable"
                >
                  Action When {sortField === 'action_when' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedActions.map((item, index) => (
                <tr key={item.uuid}>
                  <td>{index + 1}</td>
                  <td><code>{item.uuid}</code></td>
                  <td>
                    <span className="badge badge-info text-capitalize">
                      {item.action_when.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary mr-2"
                      onClick={() => handleEditClick(item)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {sortedActions.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center p-3 text-muted">
                    No actions match the search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Bootstrap Modal Backed Dialog */}
      {showModal && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editUuid ? 'Edit Action' : 'Add New Action'}</h5>
                  <button type="button" className="close" onClick={() => setShowModal(false)}>
                    <span>&times;</span>
                  </button>
                </div>
                <form onSubmit={handleSubmitAction}>
                  <div className="modal-body">
                    {formError && (
                      <div className="alert alert-danger mb-3" role="alert">
                        {formError}
                      </div>
                    )}
                    <div className="form-group">
                      <label>Action When</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. otp_create"
                        value={formActionWhen}
                        onChange={(e) => setFormActionWhen(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditUuid(null); }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Submitting...' : (editUuid ? 'Update Action' : 'Save Action')}
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
