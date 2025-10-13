import { useState, useEffect } from 'react';
import { PaymentContext, StripeProvider, IPaymentProvider } from '@/lib/payments/PaymentProvider';

// Hook to manage payments with pluggable providers
export const usePayments = (provider?: IPaymentProvider) => {
  const [paymentContext] = useState(() => new PaymentContext(provider || new StripeProvider()));
  const [isInitialized, setIsInitialized] = useState(false);
  const [availableMethods, setAvailableMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      await paymentContext.initialize();
      const methods = await paymentContext.getAvailableMethods();
      setAvailableMethods(methods);
      setIsInitialized(true);
    };
    init();
  }, [paymentContext]);

  const processPayment = async (amount: number, currency: string, methodId: string) => {
    setIsLoading(true);
    try {
      const result = await paymentContext.processPayment(amount, currency, methodId);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentHistory = async () => {
    setIsLoading(true);
    try {
      return await paymentContext.getPaymentHistory();
    } finally {
      setIsLoading(false);
    }
  };

  const switchProvider = (newProvider: IPaymentProvider) => {
    paymentContext.setProvider(newProvider);
  };

  return {
    isInitialized,
    availableMethods,
    isLoading,
    processPayment,
    getPaymentHistory,
    switchProvider,
  };
};
