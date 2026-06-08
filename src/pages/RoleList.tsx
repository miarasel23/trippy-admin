import React, { useEffect, useState } from 'react';
import { fetchRoleList, fetchPermissionList, createRole } from '../utilities/api';
import { PopupMessage } from '../components/common/PopupMessage';
import type { RoleItem, PermissionItem } from '../store/action';
import { useTranslation } from '../utilities/translation';

export default function RoleList() {
  const t = useTranslation();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Sort states
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal / Add Form states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editRoleItem, setEditRoleItem] = useState<RoleItem | null>(null);
  
  // Permission modal filter
  const [permissionFilter, setPermissionFilter] = useState<string>('');
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Common popup for API success/error messages
  const [popup, setPopup] = useState<{show:boolean; type:'success'|'error'; message:string}>({
    show: false,
    type: 'error',
    message: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rolesData, permsData] = await Promise.all([
        fetchRoleList(),
        fetchPermissionList()
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (err: any) {
      console.error('Error fetching role or permission list:', err);
      setError(err.message || 'An error occurred while fetching roles data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCheckboxChange = (permCode: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permCode)
        ? prev.filter(code => code !== permCode)
        : [...prev, permCode]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredCodes = filteredPermissions.map(p => p.code);
    setSelectedPermissions(prev => {
      // Merge unique items
      const set = new Set([...prev, ...filteredCodes]);
      return Array.from(set);
    });
  };

  const handleDeselectAllFiltered = () => {
    const filteredCodes = filteredPermissions.map(p => p.code);
    setSelectedPermissions(prev => prev.filter(code => !filteredCodes.includes(code)));
  };

  const handleEditClick = (item: RoleItem) => {
    setEditRoleItem(item);
    setFormName(item.name);
    setFormDescription(item.description || '');
    setSelectedPermissions(item.permissions ? item.permissions.map(p => p.code) : []);
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditRoleItem(null);
    setFormName('');
    setFormDescription('');
    setSelectedPermissions([]);
    setPermissionFilter('');
    setFormError(null);
  };

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError(t('nameRequiredError'));
      return;
    }
    if (selectedPermissions.length === 0) {
      setFormError(t('selectAtLeastOneError'));
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        permissions: selectedPermissions
      };

      await createRole(payload);
      
      // Reset form and close modal
      setFormName('');
      setFormDescription('');
      setSelectedPermissions([]);
      setPermissionFilter('');
      setEditRoleItem(null);
      setShowModal(false);
      
      // Refresh list
      await loadData();
      
      // Show success popup
      setPopup({
        show: true,
        type: 'success',
        message: editRoleItem ? t('roleUpdatedSuccess') : t('roleCreatedSuccess')
      });
    } catch (err: any) {
      console.error('Error saving role:', err);
      const apiMessage = err?.response?.data?.message || err.message || 'Failed to save role';
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

  // Filter roles based on search query
  const filteredRoles = roles.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    item.uuid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter permissions in the modal selector
  const filteredPermissions = permissions.filter(p =>
    p.name.toLowerCase().includes(permissionFilter.toLowerCase()) ||
    p.code.toLowerCase().includes(permissionFilter.toLowerCase())
  );

  return (
    <div className="card w-100">
      <div className="card-header">
        <div className="d-flex align-items-center justify-content-between flex-wrap w-100" style={{ gap: '15px' }}>
          <div className="d-flex align-items-center flex-wrap" style={{ gap: '15px' }}>
            <h3 className="card-title m-0">{t('roleList')}</h3>
            <div className="input-group input-group-sm" style={{ width: '250px' }}>
              <input
                type="text"
                name="table_search"
                className="form-control"
                placeholder={t('searchRoles')}
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
              <i className="fa fa-plus mr-1"></i> {t('addRole')}
            </button>
          </div>
        </div>
      </div>
      <div className="card-body p-0">
        {loading && (
          <div className="p-4 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">{t('loadingLabel')}</span>
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
                <th style={{ width: '70px' }}>{t('slNo')}</th>
                <th>{t('uuid')}</th>
                <th>{t('roleName')}</th>
                <th>{t('description')}</th>
                <th>{t('permissionsCount')}</th>
                <th>{t('permissions')}</th>
                <th style={{ width: '100px' }}>{t('actionLabel')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map((item, index) => (
                <tr key={item.uuid}>
                  <td>{index + 1}</td>
                  <td><code>{item.uuid}</code></td>
                  <td>
                    <span className="badge badge-primary font-weight-bold">
                      {item.name}
                    </span>
                  </td>
                  <td>{item.description || '-'}</td>
                  <td>
                    <span className="badge badge-info">
                      {item.permissions ? item.permissions.length : 0} {t('permissions')}
                    </span>
                  </td>
                  <td>
                    <div style={{ 
                      maxWidth: '400px', 
                      maxHeight: '85px', 
                      overflowY: 'auto', 
                      fontSize: '12px',
                      lineHeight: '1.4',
                      color: '#495057',
                      wordBreak: 'break-word'
                    }}>
                      {item.permissions && item.permissions.length > 0 ? (
                        item.permissions.map(p => p.name).join(', ')
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-info btn-xs"
                      onClick={() => handleEditClick(item)}
                    >
                      <i className="fa fa-edit mr-1"></i> {t('edit')}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRoles.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-3 text-muted">
                    {t('noRolesFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Role Modal */}
      {showModal && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editRoleItem ? t('editRole') : t('addNewRole')}</h5>
                  <button type="button" className="close" onClick={handleCloseModal}>
                    <span>&times;</span>
                  </button>
                </div>
                <form onSubmit={handleSubmitRole}>
                  <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {formError && (
                      <div className="alert alert-danger mb-3" role="alert">
                        {formError}
                      </div>
                    )}
                    <div className="form-group mb-3">
                      <label className="font-weight-bold">{t('roleNameRequired')} <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Sub-Admin"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        required
                        disabled={!!editRoleItem}
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label className="font-weight-bold">{t('description')}</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder={t('describeResponsibilities')}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                      />
                    </div>

                    <div className="border rounded p-3 bg-light">
                      <div className="d-flex justify-content-between align-items-center flex-wrap mb-2" style={{ gap: '10px' }}>
                        <label className="font-weight-bold m-0">
                          {t('selectPermissions')} ({selectedPermissions.length} {t('selected')}) <span className="text-danger">*</span>
                        </label>
                        <div className="d-flex align-items-center" style={{ gap: '10px' }}>
                          <button type="button" className="btn btn-xs btn-outline-secondary" onClick={handleSelectAllFiltered}>
                            {t('selectAll')}
                          </button>
                          <button type="button" className="btn btn-xs btn-outline-secondary" onClick={handleDeselectAllFiltered}>
                            {t('clearAll')}
                          </button>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={t('filterPermissions')}
                            style={{ width: '180px' }}
                            value={permissionFilter}
                            onChange={(e) => setPermissionFilter(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="row px-2" style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff', padding: '10px 0' }}>
                        {filteredPermissions.map(p => (
                          <div key={p.uuid} className="col-md-6 mb-2">
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`perm-${p.uuid}`}
                                checked={selectedPermissions.includes(p.code)}
                                onChange={() => handleCheckboxChange(p.code)}
                              />
                              <label className="form-check-label unselectable text-sm" htmlFor={`perm-${p.uuid}`} style={{ cursor: 'pointer' }}>
                                <strong>{p.name}</strong> <span className="text-muted">({p.code})</span>
                              </label>
                            </div>
                          </div>
                        ))}
                        {filteredPermissions.length === 0 && (
                          <div className="col-12 text-center text-muted p-2">
                            {t('noPermissionsMatch')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      {t('cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? t('submitting') : (editRoleItem ? t('updateRole') : t('saveRole'))}
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
