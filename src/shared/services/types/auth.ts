export interface User {
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  phone_number: string;
  profile_picture: string | null;
  is_active: boolean;
  role: {
    uuid: string;
    name: string;
    description: string;
  };
  permissions: Array<{ uuid: string; name: string; code: string }>;
}

export interface LoginResponse {
  status: boolean;
  message: string;
  data: {
    user: User;
    access_token: string;
    token_type: string;
  };
}
