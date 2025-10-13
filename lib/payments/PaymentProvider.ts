// Payment provider interface (Liskov Substitution Principle)
// Different payment methods (Stripe, PayPal, etc.) can implement this interface

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'wallet' | 'bank';
  icon?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface IPaymentProvider {
  name: string;
  initialize(): Promise<void>;
  getAvailableMethods(): Promise<PaymentMethod[]>;
  processPayment(amount: number, currency: string, methodId: string): Promise<PaymentResult>;
  getPaymentHistory(): Promise<any[]>;
}

// Example: Stripe provider (to be implemented)
export class StripeProvider implements IPaymentProvider {
  name = 'Stripe';

  async initialize(): Promise<void> {
    // Initialize Stripe SDK
    console.log('Stripe provider initialized');
  }

  async getAvailableMethods(): Promise<PaymentMethod[]> {
    return [
      { id: 'card', name: 'بطاقة ائتمان', type: 'card' },
      { id: 'wallet', name: 'محفظة إلكترونية', type: 'wallet' },
    ];
  }

  async processPayment(amount: number, currency: string, methodId: string): Promise<PaymentResult> {
    // TODO: Implement Stripe payment processing
    return {
      success: false,
      error: 'Not implemented yet',
    };
  }

  async getPaymentHistory(): Promise<any[]> {
    // TODO: Fetch from Stripe API
    return [];
  }
}

// Example: PayPal provider
export class PayPalProvider implements IPaymentProvider {
  name = 'PayPal';

  async initialize(): Promise<void> {
    console.log('PayPal provider initialized');
  }

  async getAvailableMethods(): Promise<PaymentMethod[]> {
    return [
      { id: 'paypal', name: 'PayPal', type: 'wallet' },
    ];
  }

  async processPayment(amount: number, currency: string, methodId: string): Promise<PaymentResult> {
    return {
      success: false,
      error: 'Not implemented yet',
    };
  }

  async getPaymentHistory(): Promise<any[]> {
    return [];
  }
}

// Payment context - switch providers easily
export class PaymentContext {
  private provider: IPaymentProvider;

  constructor(provider: IPaymentProvider) {
    this.provider = provider;
  }

  setProvider(provider: IPaymentProvider) {
    this.provider = provider;
  }

  async initialize() {
    return this.provider.initialize();
  }

  async getAvailableMethods() {
    return this.provider.getAvailableMethods();
  }

  async processPayment(amount: number, currency: string, methodId: string) {
    return this.provider.processPayment(amount, currency, methodId);
  }

  async getPaymentHistory() {
    return this.provider.getPaymentHistory();
  }
}
