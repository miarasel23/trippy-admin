import React, { useEffect, useState } from 'react';
import { fetchActionListWithLanguage, createUpdateLanguage } from '../utilities/api';
import { PopupMessage } from '../components/common/PopupMessage';
import type { ActionWithLanguageItem } from '../store/action';

export default function ActionLanguageList() {
  const [actions, setActions] = useState<ActionWithLanguageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Sort states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'id' | 'action_when'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal / Edit Form states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedAction, setSelectedAction] = useState<ActionWithLanguageItem | null>(null);
  const [englishMessage, setEnglishMessage] = useState<string>('');
  const [bengaliMessage, setBengaliMessage] = useState<string>('');
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Common popup for API success/error messages
  const [popup, setPopup] = useState<{show:boolean; type:'success'|'error'; message:string}>({
    show: false,
    type: 'error',
    message: ''
  });

  const loadActions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchActionListWithLanguage();
      setActions(data);
    } catch (err: any) {
      console.error('Error fetching action language list:', err);
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

  const handleTranslateClick = (item: ActionWithLanguageItem) => {
    setSelectedAction(item);
    
    // Find existing translations
    const enMsg = item.messages.find(m => m.language_code === 'en')?.message || '';
    const bnMsg = item.messages.find(m => m.language_code === 'bn')?.message || '';
    
    setEnglishMessage(enMsg);
    setBengaliMessage(bnMsg);
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmitTranslation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) return;

    try {
      setSubmitting(true);
      setFormError(null);

      // Find existing message UUIDs if any
      const enUuid = selectedAction.messages.find(m => m.language_code === 'en')?.uuid || null;
      const bnUuid = selectedAction.messages.find(m => m.language_code === 'bn')?.uuid || null;

      const payload = {
        action_uuid: selectedAction.uuid,
        action_when: selectedAction.action_when,
        messages: [
          {
            language_code: 'en',
            message: englishMessage.trim(),
            uuid: enUuid
          },
          {
            language_code: 'bn',
            message: bengaliMessage.trim(),
            uuid: bnUuid
          }
        ]
      };

      await createUpdateLanguage(payload);
      
      // Reset and close
      setShowModal(false);
      setSelectedAction(null);
      
      // Refresh list
      await loadActions();
      
      // Show success popup
      setPopup({
        show: true,
        type: 'success',
        message: 'Translations updated successfully'
      });
    } catch (err: any) {
      console.error('Error updating translations:', err);
      const apiMessage = err?.response?.data?.message || err.message || 'Failed to update translations';
      setFormError(apiMessage);
      setPopup({
        show: true,
        type: 'error',
        message: apiMessage
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter actions based on search query
  const filteredActions = actions.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesAction = item.action_when.toLowerCase().includes(query) ||
      item.uuid.toLowerCase().includes(query) ||
      item.id.toString().includes(query);
      
    const matchesTranslations = item.messages.some(m => 
      m.message.toLowerCase().includes(query) || m.language_code.toLowerCase().includes(query)
    );

    return matchesAction || matchesTranslations;
  });

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
            <h3 className="card-title m-0">Action with Language List</h3>
            <div className="input-group input-group-sm" style={{ width: '250px' }}>
              <input
                type="text"
                name="table_search"
                className="form-control"
                placeholder="Search actions or translations..."
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
                <th>English Translation</th>
                <th>Bengali Translation</th>
                <th style={{ width: '120px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedActions.map((item, index) => {
                const enMsg = item.messages.find(m => m.language_code === 'en')?.message || '-';
                const bnMsg = item.messages.find(m => m.language_code === 'bn')?.message || '-';
                
                return (
                  <tr key={item.uuid}>
                    <td>{index + 1}</td>
                    <td><code>{item.uuid}</code></td>
                    <td>
                      <span className="badge badge-info text-capitalize">
                        {item.action_when.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{enMsg}</td>
                    <td>{bnMsg}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleTranslateClick(item)}
                      >
                        Translate
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sortedActions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center p-3 text-muted">
                    No actions match the search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Translations Modal */}
      {showModal && selectedAction && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Manage Translations</h5>
                  <button type="button" className="close" onClick={() => { setShowModal(false); setSelectedAction(null); }}>
                    <span>&times;</span>
                  </button>
                </div>
                <form onSubmit={handleSubmitTranslation}>
                  <div className="modal-body">
                    {formError && (
                      <div className="alert alert-danger mb-3" role="alert">
                        {formError}
                      </div>
                    )}
                    <div className="form-group mb-3">
                      <label className="font-weight-bold">Action When</label>
                      <input
                        type="text"
                        className="form-control-plaintext bg-light px-2 py-1 rounded"
                        value={selectedAction.action_when}
                        readOnly
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label className="font-weight-bold">English Translation</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Enter English message..."
                        value={englishMessage}
                        onChange={(e) => setEnglishMessage(e.target.value)}
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label className="font-weight-bold">Bengali Translation</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Enter Bengali message..."
                        value={bengaliMessage}
                        onChange={(e) => setBengaliMessage(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setSelectedAction(null); }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Save Translations'}
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
        onClose={() => setPopup(prev => ({...prev, show:false}))}
      />
    </div>
  );
}
