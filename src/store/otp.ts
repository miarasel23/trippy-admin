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
