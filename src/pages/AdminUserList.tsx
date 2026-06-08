import React, { useEffect, useState } from 'react';
import { fetchAdminUserList, createAdminUser, editAdminUser, fetchRoleList, newwork_image_url } from '../utilities/api';
import { PopupMessage } from '../components/common/PopupMessage';
import { useTranslation } from '../utilities/translation';
import type { RoleItem } from '../store/action';
import noImage from '../assets/no-image.png';

interface AdminUserItem {
  uuid: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  country_code: string;
  username: string;
  email: string;
  is_active: boolean | number;
  is_superuser: boolean | number;
  profile_picture?: string | null;
  role?: {
    uuid: string;
    name: string;
    description: string;
  } | null;
}

export default function AdminUserList() {
  const t = useTranslation();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal / Form states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<AdminUserItem | null>(null);

  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('+880');
  const [password, setPassword] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isActive, setIsActive] = useState<number>(1);
  const [isSuperuser, setIsSuperuser] = useState<number>(0);

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
      const [usersData, rolesData] = await Promise.all([
        fetchAdminUserList(),
        fetchRoleList()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err: any) {
      console.error('Error fetching admin users or roles:', err);
      setError(err.message || 'An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditClick = (item: AdminUserItem) => {
    setEditItem(item);
    setFirstName(item.first_name);
    setLastName(item.last_name);
    setUsername(item.username);
    setEmail(item.email);
    setPhoneNumber(item.phone_number);
    setCountryCode(item.country_code || '+880');
    setSelectedRole(item.role?.name || '');
    setIsActive(item.is_active ? 1 : 0);
    setIsSuperuser(item.is_superuser ? 1 : 0);
    setPassword('');
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditItem(null);
    setFirstName('');
    setLastName('');
    setUsername('');
    setEmail('');
    setPhoneNumber('');
    setCountryCode('+880');
    setPassword('');
    setSelectedRole('');
    setIsActive(1);
    setIsSuperuser(0);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setFormError('First and Last names are required');
      return;
    }
    if (!username.trim()) {
      setFormError(t('usernameRequired'));
      return;
    }
    if (!email.trim()) {
      setFormError(t('emailRequired'));
      return;
    }
    if (!phoneNumber.trim()) {
      setFormError(t('phoneRequired'));
      return;
    }
    if (!selectedRole) {
      setFormError('Please select a Role');
      return;
    }
    if (!editItem && !password) {
      setFormError(t('passwordRequired'));
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload: any = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.trim(),
        country_code: countryCode.trim(),
        username: username.trim(),
        email: email.trim(),
        role: selectedRole,
        is_active: isActive,
        is_superuser: isSuperuser
      };

      if (password) {
        payload.password = password;
      }

      if (editItem) {
        payload.uuid = editItem.uuid;
        await editAdminUser(payload);
      } else {
        await createAdminUser(payload);
      }

      handleCloseModal();
      await loadData();

      setPopup({
        show: true,
        type: 'success',
        message: editItem ? t('adminUpdatedSuccess') : t('adminCreatedSuccess')
      });
    } catch (err: any) {
      console.error('Error saving admin user:', err);
      setFormError(err.response?.data?.detail || err.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  // Search filter
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    return (
      fullName.includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.role?.name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="container-fluid px-0">
      {/* Page Header */}
      <div className="row mb-3 align-items-center">
        <div className="col-sm-6">
          <h1 className="m-0 font-weight-bold text-dark">{t('adminUserList')}</h1>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3">
          <div className="row align-items-center">
            <div className="col-md-6 col-sm-12 mb-2 mb-md-0">
              <div className="input-group" style={{ maxWidth: '350px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('searchRoles')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="input-group-append">
                  <span className="input-group-text bg-light border-left-0">
                    <i className="fa fa-search text-muted"></i>
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-sm-12 text-md-right">
              <button
                type="button"
                className="btn btn-primary btn-sm rounded-pill px-3 py-2"
                onClick={() => {
                  setFormError(null);
                  setShowModal(true);
                }}
              >
                <i className="fa fa-plus mr-1"></i> {t('createAdminUser')}
              </button>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {loading && (
            <div className="p-5 text-center">
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
            <div className="table-responsive">
              <table className="table table-striped table-hover w-100 m-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: '70px' }} className="text-center">{t('slNo')}</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>{t('username')}</th>
                    <th>{t('email')}</th>
                    <th>{t('phoneNumber')}</th>
                    <th>{t('role')}</th>
                    <th className="text-center">{t('status')}</th>
                    <th className="text-center">Superuser</th>
                    <th style={{ width: '100px' }} className="text-center">{t('actionLabel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center text-muted p-4">
                        No admin users match the search query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((item, index) => {
                      const avatarUrl = item.profile_picture
                        ? (item.profile_picture.startsWith('http') ? item.profile_picture : `${newwork_image_url}${item.profile_picture}`)
                        : noImage;

                      return (
                        <tr key={item.uuid}>
                          <td className="text-center font-weight-bold text-muted">{index + 1}</td>
                          <td>
                            <img
                              src={avatarUrl}
                              alt={item.username}
                              className="img-circle elevation-1 border"
                              style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = noImage;
                              }}
                            />
                          </td>
                          <td className="font-weight-bold text-dark">{item.first_name} {item.last_name}</td>
                          <td><code>{item.username}</code></td>
                          <td>{item.email}</td>
                          <td>
                            <span className="text-muted">{item.country_code} {item.phone_number}</span>
                          </td>
                          <td>
                            <span className="badge badge-primary px-2 py-1">
                              {item.role?.name || 'No Role'}
                            </span>
                          </td>
                          <td className="text-center">
                            {item.is_active ? (
                              <span className="badge badge-success px-2 py-1">{t('active')}</span>
                            ) : (
                              <span className="badge badge-secondary px-2 py-1">{t('inactive')}</span>
                            )}
                          </td>
                          <td className="text-center">
                            {item.is_superuser ? (
                              <span className="badge badge-warning text-dark font-weight-bold px-2 py-1">{t('yes')}</span>
                            ) : (
                              <span className="badge badge-light px-2 py-1">{t('no')}</span>
                            )}
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-xs px-2 py-1"
                              onClick={() => handleEditClick(item)}
                            >
                              <i className="fa fa-edit mr-1"></i> {t('edit')}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Admin User Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
              <div className="modal-header bg-primary text-white border-0" style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                <h5 className="modal-title font-weight-bold">
                  {editItem ? t('editAdminUser') : t('createAdminUser')}
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
                    {/* First Name */}
                    <div className="col-md-6 col-sm-12 form-group">
                      <label className="font-weight-bold text-dark">{t('firstName')} *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>

                    {/* Last Name */}
                    <div className="col-md-6 col-sm-12 form-group">
                      <label className="font-weight-bold text-dark">{t('lastName')} *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    {/* Username */}
                    <div className="col-md-6 col-sm-12 form-group">
                      <label className="font-weight-bold text-dark">{t('username')} *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="johndoe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={!!editItem}
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="col-md-6 col-sm-12 form-group">
                      <label className="font-weight-bold text-dark">{t('email')} *</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="john.doe@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    {/* Country Code */}
                    <div className="col-md-3 col-sm-4 form-group">
                      <label className="font-weight-bold text-dark">{t('countryCode')} *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="+880"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        required
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="col-md-9 col-sm-8 form-group">
                      <label className="font-weight-bold text-dark">{t('phoneNumber')} *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="1XXXXXXXXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    {/* Password */}
                    <div className="col-md-6 col-sm-12 form-group">
                      <label className="font-weight-bold text-dark">
                        {t('password')} {editItem ? '(Leave empty to keep current)' : '*'}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="******"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={!editItem}
                      />
                    </div>

                    {/* Role Select */}
                    <div className="col-md-6 col-sm-12 form-group">
                      <label className="font-weight-bold text-dark">{t('role')} *</label>
                      <select
                        className="form-control"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        required
                      >
                        <option value="">-- Select Role --</option>
                        {roles.map((r) => (
                          <option key={r.uuid} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row align-items-center mt-2">
                    {/* Is Active */}
                    <div className="col-md-6 col-sm-12 form-group">
                      <label className="font-weight-bold text-dark mr-3">{t('status')}</label>
                      <select
                        className="form-control"
                        value={isActive}
                        onChange={(e) => setIsActive(Number(e.target.value))}
                      >
                        <option value={1}>{t('active')}</option>
                        <option value={0}>{t('inactive')}</option>
                      </select>
                    </div>

                    {/* Is Superuser */}
                    <div className="col-md-6 col-sm-12 form-group">
                      <label className="font-weight-bold text-dark mr-3">Superuser Access</label>
                      <select
                        className="form-control"
                        value={isSuperuser}
                        onChange={(e) => setIsSuperuser(Number(e.target.value))}
                      >
                        <option value={0}>{t('no')}</option>
                        <option value={1}>{t('yes')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light border-0" style={{ borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px' }}>
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={handleCloseModal} disabled={submitting}>
                    {t('cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={submitting}>
                    {submitting ? t('submitting') : (editItem ? 'Save Changes' : 'Create User')}
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
    </div>
  );
}
