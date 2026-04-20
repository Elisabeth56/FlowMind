import crypto from 'crypto'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

// Generic fetch wrapper for Paystack API
async function paystackFetch<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: Record<string, unknown>
  } = {}
): Promise<T> {
  const { method = 'GET', body } = options

  const response = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Paystack API error')
  }

  return data
}

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

interface PaystackCustomer {
  id: number
  customer_code: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  metadata: Record<string, unknown>
  subscriptions: PaystackSubscription[]
}

export async function createCustomer(data: {
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  metadata?: Record<string, unknown>
}): Promise<PaystackCustomer> {
  const response = await paystackFetch<{ data: PaystackCustomer }>('/customer', {
    method: 'POST',
    body: data,
  })
  return response.data
}

export async function getCustomer(emailOrCode: string): Promise<PaystackCustomer | null> {
  try {
    const response = await paystackFetch<{ data: PaystackCustomer }>(
      `/customer/${encodeURIComponent(emailOrCode)}`
    )
    return response.data
  } catch {
    return null
  }
}

export async function updateCustomer(
  customerCode: string,
  data: {
    first_name?: string
    last_name?: string
    phone?: string
    metadata?: Record<string, unknown>
  }
): Promise<PaystackCustomer> {
  const response = await paystackFetch<{ data: PaystackCustomer }>(
    `/customer/${customerCode}`,
    { method: 'PUT', body: data }
  )
  return response.data
}

// ============================================
// TRANSACTION / CHECKOUT
// ============================================

interface InitializeTransactionResponse {
  authorization_url: string
  access_code: string
  reference: string
}

export async function initializeTransaction(data: {
  email: string
  amount: number // in kobo (100 kobo = ₦1)
  reference?: string
  callback_url?: string
  plan?: string // Plan code for subscription
  metadata?: Record<string, unknown>
  channels?: ('card' | 'bank' | 'ussd' | 'qr' | 'mobile_money' | 'bank_transfer')[]
}): Promise<InitializeTransactionResponse> {
  const response = await paystackFetch<{ data: InitializeTransactionResponse }>(
    '/transaction/initialize',
    { method: 'POST', body: data }
  )
  return response.data
}

interface VerifyTransactionResponse {
  id: number
  status: 'success' | 'failed' | 'abandoned'
  reference: string
  amount: number
  customer: PaystackCustomer
  authorization: {
    authorization_code: string
    card_type: string
    last4: string
    exp_month: string
    exp_year: string
    bank: string
    reusable: boolean
  }
  plan?: {
    plan_code: string
    name: string
  }
}

export async function verifyTransaction(reference: string): Promise<VerifyTransactionResponse> {
  const response = await paystackFetch<{ data: VerifyTransactionResponse }>(
    `/transaction/verify/${encodeURIComponent(reference)}`
  )
  return response.data
}

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

interface PaystackSubscription {
  id: number
  subscription_code: string
  email_token: string
  status: 'active' | 'non-renewing' | 'attention' | 'completed' | 'cancelled'
  amount: number
  plan: {
    plan_code: string
    name: string
    interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'
    amount: number
  }
  next_payment_date: string
  created_at: string
}

export async function createSubscription(data: {
  customer: string // email or customer_code
  plan: string // plan_code
  authorization?: string // authorization_code for existing card
  start_date?: string // ISO 8601 date for first charge
}): Promise<PaystackSubscription> {
  const response = await paystackFetch<{ data: PaystackSubscription }>('/subscription', {
    method: 'POST',
    body: data,
  })
  return response.data
}

export async function getSubscription(
  idOrCode: string | number
): Promise<PaystackSubscription | null> {
  try {
    const response = await paystackFetch<{ data: PaystackSubscription }>(
      `/subscription/${idOrCode}`
    )
    return response.data
  } catch {
    return null
  }
}

export async function listSubscriptions(params?: {
  customer?: number
  plan?: number
  perPage?: number
  page?: number
}): Promise<PaystackSubscription[]> {
  const searchParams = new URLSearchParams()
  if (params?.customer) searchParams.set('customer', String(params.customer))
  if (params?.plan) searchParams.set('plan', String(params.plan))
  if (params?.perPage) searchParams.set('perPage', String(params.perPage))
  if (params?.page) searchParams.set('page', String(params.page))

  const query = searchParams.toString()
  const response = await paystackFetch<{ data: PaystackSubscription[] }>(
    `/subscription${query ? `?${query}` : ''}`
  )
  return response.data
}

export async function disableSubscription(data: {
  code: string
  token: string
}): Promise<{ message: string }> {
  const response = await paystackFetch<{ message: string }>('/subscription/disable', {
    method: 'POST',
    body: data,
  })
  return response
}

export async function enableSubscription(data: {
  code: string
  token: string
}): Promise<{ message: string }> {
  const response = await paystackFetch<{ message: string }>('/subscription/enable', {
    method: 'POST',
    body: data,
  })
  return response
}

// ============================================
// PLAN MANAGEMENT
// ============================================

interface PaystackPlan {
  id: number
  plan_code: string
  name: string
  description: string | null
  amount: number
  interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'
  currency: string
}

export async function listPlans(): Promise<PaystackPlan[]> {
  const response = await paystackFetch<{ data: PaystackPlan[] }>('/plan')
  return response.data
}

export async function getPlan(idOrCode: string | number): Promise<PaystackPlan | null> {
  try {
    const response = await paystackFetch<{ data: PaystackPlan }>(`/plan/${idOrCode}`)
    return response.data
  } catch {
    return null
  }
}

// ============================================
// WEBHOOK VERIFICATION
// ============================================

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest('hex')

  return hash === signature
}

// ============================================
// HELPER: Generate unique reference
// ============================================

export function generateReference(prefix = 'fm'): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}_${timestamp}_${random}`
}
