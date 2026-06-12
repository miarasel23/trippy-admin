// ─── Customer ───────────────────────────────────────────────

export interface CustomerUserItem {
  uuid: string;
  full_name: string | null;
  email: string | null;
  phone_number: string;
  country_code: string;
  profile_picture: string | null;
  nid_number: string | null;
  is_notification_enabled: boolean;
  device_token_for_notification: string | null;
  is_active: boolean;
  role: {
    uuid: string;
    name: string;
    description: string;
  };
  permissions: {
    uuid: string;
    name: string;
    code: string;
  }[];
}

export interface UpdateCustomerProfilePayload {
  uuid: string;
  full_name: string;
  email: string;
  phone_number: string;
  country_code: string;
  is_notification_enabled: boolean;
  device_token_for_notification: string;
  is_active: boolean;
}
