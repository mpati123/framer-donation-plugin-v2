// Shared types for Donations SaaS

export interface Organization {
  id: string;
  name: string;
  email: string;
  stripe_account_id?: string;
  stripe_account_status?: 'pending' | 'active' | 'restricted';
  created_at: string;
  updated_at: string;
}

export interface License {
  id: string;
  organization_id: string;
  license_key: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan: 'monthly' | 'yearly';
  price_amount: number;
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  trial_ends_at?: string;
  current_period_start: string;
  current_period_end: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed' | 'free';
  discount_value: number;
  applies_to: 'all' | 'monthly' | 'yearly';
  max_uses?: number;
  current_uses: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
}

export interface LicenseStatus {
  valid: boolean;
  status: 'active' | 'trial' | 'expired' | 'locked' | 'not_found';
  plan?: string;
  expiresAt?: string;
  daysRemaining?: number;
  organization?: {
    name: string;
    stripeConnected: boolean;
  };
  message?: string;
}

// Plugin version info
export const PLUGIN_VERSION = "1.0.1";
export const PLUGIN_CHANGELOG = "Dodano system licencji i weryfikację klucza";
