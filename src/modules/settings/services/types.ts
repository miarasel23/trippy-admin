// ─── Action ─────────────────────────────────────────────────

export interface ActionItem {
  id: number;
  uuid: string;
  action_when: string;
}

export interface ActionListResponse {
  status: boolean;
  message: string;
  data: ActionItem[];
}

export interface ActionLanguageMessage {
  id: number;
  uuid: string;
  language_code: string;
  message: string;
}

export interface ActionWithLanguageItem {
  id: number;
  uuid: string;
  action_when: string;
  messages: ActionLanguageMessage[];
}

export interface PermissionItem {
  uuid: string;
  name: string;
  code: string;
  description?: string;
}

export interface RoleItem {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  permissions: PermissionItem[];
}

// ─── Car Category ───────────────────────────────────────────

export interface CarCategoryItem {
  id: number;
  uuid: string;
  car_type: string;
  car_avatar?: string | null;
  set_capacity?: number | string | null;
  status?: string | null;
  sort_order?: number | null;
}

export interface CreateOrUpdateCarCategoryPayload {
  uuid?: string;
  car_type: string;
  set_capacity: string | number;
  status: string;
  sort_order: number;
  car_avatar?: File | null;
}

// ─── Car Service Category ───────────────────────────────────

export interface CarServiceCategoryItem {
  id: number;
  uuid: string;
  service_name: string;
  avatar?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  car_category?: CarCategoryItem | null;
}

export interface CreateOrUpdateCarServiceCategoryPayload {
  uuid?: string;
  service_name: string;
  status: string;
  car_category_uuid: string;
  service_avatar?: File | null;
}

// ─── Driver Subscription ────────────────────────────────────

export interface DriverSubscriptionItem {
  id: number;
  uuid: string;
  subscription_type: string;
  price: number;
  previous_price: number;
  validate_for: number;
  created_at: string;
  updated_at: string;
  status: string;
  flag_one?: number | string | null;
  flag_two?: number | string | null;
}

export interface CreateUpdateSubscriptionPayload {
  uuid?: string;
  subscription_type: string;
  price: number;
  previous_price: number;
  validate_for: number;
  car_categories_uuid: string;
  status: string;
  flag_one: number | string;
  flag_two: number | string;
}

// ─── Price Set As Per Km ────────────────────────────────────

export interface PriceSetAsPerKmItem {
  id: number;
  uuid: string;
  price_per_km: number;
  minimum_booking_price: number;
  waiting_time: number;
  waiting_price: number;
  cancellation_fee: number;
  busy_time_price_percentage: number;
  busy_start_time: string;
  busy_end_time: string;
  country_code: string;
  status: string;
  created_at: string;
  updated_at: string;
  car_service_category?: CarServiceCategoryItem | null;
}

export interface CreateOrUpdatePriceSetAsPerKmPayload {
  uuid?: string;
  price_per_km: number;
  minimum_booking_price: number;
  status: string;
  waiting_time: number;
  waiting_price: number;
  cancellation_fee: number;
  busy_start_time: string;
  busy_end_time: string;
  busy_time_price_percentage: number;
  country_code: string;
  car_service_category_uuid: string;
}

// ─── OTP ────────────────────────────────────────────────────

export interface OtpMessageItem {
  id: number;
  uuid: string;
  county_code_for_otp: string;
  otp_code: string;
  otp_message: string;
  status: string;
  created_at: string;
  updated_at: string;
}
