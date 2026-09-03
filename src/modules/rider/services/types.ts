export interface Role {
  uuid: string;
  name: string;
  description: string;
}

export interface Permission {
  uuid: string;
  name: string;
  code: string;
}

export interface RiderItem {
  uuid: string;
  full_name: string | null;
  email: string | null;
  phone_number: string;
  country_code: string;
  profile_picture: string | null;
  is_notification_enabled: boolean;
  device_token_for_notification: string | null;
  is_active: string;
  nid_number?: string;
  role: Role;
  permissions: Permission[];
}

export interface UpdateRiderProfilePayload {
  phone_number: string;
  country_code: string;
  uuid: string;
  is_active: string;
  is_notification_enabled: boolean;
  device_token_for_notification: string | null;
  full_name?: string;
  email?: string;
  password?: string;
  nid_number?: string;
}

export interface UpdateRiderProfilePicturePayload {
  driver_uuid: string;
  avatar: File;
}

export interface DriverDocumentItem {
  id: number;
  document_type: string | null;
  document_url: string;
  document_number: string | null;
  is_verified: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CarPhotoItem {
  id: number;
  document_type: string | null;
  document_url: string;
  car_categories_uuid: string;
  is_verified: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─── Driver Transaction History ───────────────────────────────

export type TransactionFilterType =
  | 'today'
  | 'this_week'
  | 'last_week'
  | 'last_month'
  | 'last_three_month';

export interface ActivePackageDetails {
  id: string | null;
  subscription_uuid: string | null;
  subscription_renewal_date_time: string | null;
  subscription_expiry_date_time: string | null;
  car_subscription_type: string | null;
  car_subscription_price: number;
}

export interface DriverTransactionItem {
  uuid: string;
  debit: number;
  credit: number;
  main_balance: number;
  bounce_debit: number;
  bounce_credit: number;
  bounce_main_balance: number;
  description: string | null;
  created_at: string | null;
}

export interface DriverTransactionHistoryResponse {
  status: boolean;
  message: string;
  active_pacage_details: ActivePackageDetails | null;
  current_blanc: number;
  due_blanc: number;
  total_earning: number;
  data: DriverTransactionItem[];
}

export interface RechargeDriverAccountParams {
  driver_uuid: string;
  transaction_id: string;
  country_code?: string;
  subscription_uuid?: string;
}
