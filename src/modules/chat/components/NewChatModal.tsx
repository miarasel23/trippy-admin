import React, { useState, useEffect, useMemo } from 'react';
import type { ActiveChatTarget } from '../types';
import { fetchCustomerList, type CustomerUserItem } from '../../customer/services/customerApi';
import { fetchRiderList, type RiderItem } from '../../rider/services/riderApi';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (target: ActiveChatTarget) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onStartChat,
}) => {
  const [receiverType, setReceiverType] = useState<'CUSTOMER' | 'DRIVER'>('CUSTOMER');
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerUserItem[]>([]);
  const [drivers, setDrivers] = useState<RiderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fallback / manual mode
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualUuid, setManualUuid] = useState('');
  const [manualName, setManualName] = useState('');

  // Fetch customers when modal opens or when tab switches
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadUsers = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        if (receiverType === 'CUSTOMER') {
          if (customers.length === 0) {
            const data = await fetchCustomerList();
            if (isMounted) setCustomers(data);
          }
        } else {
          if (drivers.length === 0) {
            const data = await fetchRiderList();
            if (isMounted) setDrivers(data);
          }
        }
      } catch (err: any) {
        console.error('Failed to load user list:', err);
        if (isMounted) {
          setFetchError(err.message || 'Failed to load user list');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [isOpen, receiverType, customers.length, drivers.length]);

  // Reset search and errors when changing type or opening
  useEffect(() => {
    setSearchQuery('');
    setFetchError(null);
  }, [receiverType, isOpen]);

  // Filtered lists
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        (c.full_name && c.full_name.toLowerCase().includes(q)) ||
        (c.phone_number && c.phone_number.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.uuid && c.uuid.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  const filteredDrivers = useMemo(() => {
    if (!searchQuery.trim()) return drivers;
    const q = searchQuery.toLowerCase();
    return drivers.filter(
      (d) =>
        (d.full_name && d.full_name.toLowerCase().includes(q)) ||
        (d.phone_number && d.phone_number.toLowerCase().includes(q)) ||
        (d.email && d.email.toLowerCase().includes(q)) ||
        (d.uuid && d.uuid.toLowerCase().includes(q))
    );
  }, [drivers, searchQuery]);

  if (!isOpen) return null;

  // Select user handler
  const handleSelectUser = (uuid: string, name: string | null) => {
    onStartChat({
      receiver_type: receiverType,
      receiver_uuid: uuid,
      receiver_name: name || (receiverType === 'DRIVER' ? 'Driver' : 'Customer'),
    });
    onClose();
  };

  // Manual form submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUuid.trim()) return;

    onStartChat({
      receiver_type: receiverType,
      receiver_uuid: manualUuid.trim(),
      receiver_name: manualName.trim() || (receiverType === 'DRIVER' ? 'Driver' : 'Customer'),
    });
    onClose();
  };

  const isDriver = receiverType === 'DRIVER';

  return (
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-white">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-sm font-bold">
              <i className="fa fa-commenting-o"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Start New Conversation</h3>
              <p className="text-[11px] text-slate-400">
                Select a {isDriver ? 'driver' : 'customer'} to start messaging
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* User Type Tabs & Search */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 space-y-3 shrink-0">
          {/* Tabs: Customer vs Driver */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setReceiverType('CUSTOMER');
                setIsManualMode(false);
              }}
              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-semibold text-xs transition ${
                receiverType === 'CUSTOMER'
                  ? 'bg-violet-600/25 border-violet-500 text-violet-300 shadow-md shadow-violet-500/10'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <i className="fa fa-user"></i>
              <span>Customer List {customers.length > 0 && `(${customers.length})`}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setReceiverType('DRIVER');
                setIsManualMode(false);
              }}
              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-semibold text-xs transition ${
                receiverType === 'DRIVER'
                  ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <i className="fa fa-car"></i>
              <span>Driver List {drivers.length > 0 && `(${drivers.length})`}</span>
            </button>
          </div>

          {/* Search bar & mode switch */}
          {!isManualMode && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <i className="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  placeholder={`Search ${isDriver ? 'drivers' : 'customers'} by name, phone, email...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 text-xs rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsManualMode(true)}
                title="Enter UUID manually"
                className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 shrink-0"
              >
                <i className="fa fa-terminal text-[10px]"></i>
                <span className="hidden sm:inline">Manual UUID</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body: User List or Manual Form */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {isManualMode ? (
            /* Manual UUID Form */
            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-1">
                <span className="text-slate-300 font-semibold">Enter UUID Directly</span>
                <button
                  type="button"
                  onClick={() => setIsManualMode(false)}
                  className="text-blue-400 hover:underline text-xs"
                >
                  ← Back to {isDriver ? 'Driver' : 'Customer'} List
                </button>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  {isDriver ? 'Driver' : 'Customer'} UUID <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3810b347-ab60-4004-891d-81060cf4135c"
                  value={manualUuid}
                  onChange={(e) => setManualUuid(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Md Rasel Mia"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualMode(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 transition"
                >
                  Start Chat
                </button>
              </div>
            </form>
          ) : loading ? (
            /* Loading Spinner */
            <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-2.5">
              <i className="fa fa-circle-o-notch fa-spin text-2xl text-blue-500"></i>
              <span className="text-xs">Loading {isDriver ? 'driver' : 'customer'} list...</span>
            </div>
          ) : fetchError ? (
            /* Error & Retry */
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl text-center space-y-3">
              <p>{fetchError}</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setCustomers([]);
                    setDrivers([]);
                  }}
                  className="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-white rounded-lg text-xs font-semibold transition"
                >
                  <i className="fa fa-refresh mr-1"></i> Retry
                </button>
                <button
                  onClick={() => setIsManualMode(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs transition"
                >
                  Enter UUID Manually
                </button>
              </div>
            </div>
          ) : isDriver ? (
            /* Driver Cards List */
            filteredDrivers.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <i className="fa fa-car text-3xl mb-2 text-slate-600"></i>
                <p className="text-xs font-medium text-slate-300">No drivers found</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {searchQuery ? 'Try a different search query' : 'Driver list is currently empty'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDrivers.map((driver) => {
                  const displayName = driver.full_name || 'Driver User';
                  return (
                    <div
                      key={driver.uuid}
                      onClick={() => handleSelectUser(driver.uuid, driver.full_name)}
                      className="group flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-emerald-600/15 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all duration-150"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white group-hover:text-emerald-300 truncate transition-colors">
                              {displayName}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                              DRIVER
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            {driver.phone_number && (
                              <span>
                                <i className="fa fa-phone text-[9px] mr-1 text-slate-500"></i>
                                {driver.phone_number}
                              </span>
                            )}
                            {driver.email && (
                              <span className="truncate max-w-[150px]">
                                <i className="fa fa-envelope-o text-[9px] mr-1 text-slate-500"></i>
                                {driver.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <button className="px-3 py-1.5 bg-emerald-600/20 group-hover:bg-emerald-600 text-emerald-300 group-hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm">
                          <span>Chat</span>
                          <i className="fa fa-paper-plane text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Customer Cards List */
            filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <i className="fa fa-users text-3xl mb-2 text-slate-600"></i>
                <p className="text-xs font-medium text-slate-300">No customers found</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {searchQuery ? 'Try a different search query' : 'Customer list is currently empty'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCustomers.map((customer) => {
                  const displayName = customer.full_name || 'Customer User';
                  return (
                    <div
                      key={customer.uuid}
                      onClick={() => handleSelectUser(customer.uuid, customer.full_name)}
                      className="group flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-violet-600/15 border border-slate-800 hover:border-violet-500/40 cursor-pointer transition-all duration-150"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white group-hover:text-violet-300 truncate transition-colors">
                              {displayName}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20 shrink-0">
                              CUSTOMER
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            {customer.phone_number && (
                              <span>
                                <i className="fa fa-phone text-[9px] mr-1 text-slate-500"></i>
                                {customer.phone_number}
                              </span>
                            )}
                            {customer.email && (
                              <span className="truncate max-w-[150px]">
                                <i className="fa fa-envelope-o text-[9px] mr-1 text-slate-500"></i>
                                {customer.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <button className="px-3 py-1.5 bg-violet-600/20 group-hover:bg-violet-600 text-violet-300 group-hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm">
                          <span>Chat</span>
                          <i className="fa fa-paper-plane text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>
            {!isManualMode && (
              <>
                Showing{' '}
                <strong className="text-white font-semibold">
                  {isDriver ? filteredDrivers.length : filteredCustomers.length}
                </strong>{' '}
                {isDriver ? 'drivers' : 'customers'}
              </>
            )}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
