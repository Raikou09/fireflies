import axios from 'axios';
import { randomUUID } from 'crypto';

const SANDBOX_BASE_URL = 'https://sandbox.safaricom.co.ke';
const PRODUCTION_BASE_URL = 'https://api.safaricom.co.ke';

// Check if simulation mode is enabled
export const isSimulationMode = (): boolean => {
  return process.env.MPESA_SIMULATION_MODE === 'true';
};

// Store simulated payments for status queries
const simulatedPayments: Map<string, { 
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  phone: string;
  createdAt: Date;
}> = new Map();

const getBaseUrl = () => {
  return process.env.NODE_ENV === 'production' ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL;
};

const getTimestamp = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

const generatePassword = (timestamp: string): string => {
  const shortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
  const passKey = process.env.MPESA_PASS_KEY;
  const str = `${shortCode}${passKey}${timestamp}`;
  return Buffer.from(str).toString('base64');
};

// Generate simulated M-Pesa receipt number
const generateSimulatedReceipt = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const prefix = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  const numbers = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  const suffix = Array.from({ length: 2 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  return `${prefix}${numbers}${suffix}`;
};

export const getAccessToken = async (): Promise<string> => {
  try {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    
    if (!consumerKey || !consumerSecret) {
      throw new Error('M-Pesa credentials not configured');
    }
    
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    console.log('Requesting M-Pesa access token from:', `${getBaseUrl()}/oauth/v1/generate`);
    
    const response = await axios.get(
      `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    
    console.log('M-Pesa access token obtained successfully');
    return response.data.access_token;
  } catch (error: any) {
    console.error('Error getting M-Pesa access token:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw new Error(`Failed to get M-Pesa access token: ${error.response?.data?.error_description || error.message}`);
  }
};

export const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  } else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
};

export interface STKPushRequest {
  phone: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export const initiateSTKPush = async (request: STKPushRequest): Promise<STKPushResponse> => {
  const formattedPhone = formatPhoneNumber(request.phone);
  
  // SIMULATION MODE - for testing without real M-Pesa
  if (isSimulationMode()) {
    console.log('[SIMULATION] Initiating simulated M-Pesa STK Push:', { 
      phone: formattedPhone, 
      amount: request.amount 
    });
    
    const checkoutRequestId = `SIM_${randomUUID().replace(/-/g, '').substring(0, 20)}`;
    const merchantRequestId = `SIM_MR_${randomUUID().replace(/-/g, '').substring(0, 15)}`;
    
    // Store simulated payment - will auto-complete after 3 seconds
    simulatedPayments.set(checkoutRequestId, {
      status: 'pending',
      amount: request.amount,
      phone: formattedPhone,
      createdAt: new Date(),
    });
    
    // Auto-complete payment after 3 seconds (simulates user entering PIN)
    setTimeout(() => {
      const payment = simulatedPayments.get(checkoutRequestId);
      if (payment && payment.status === 'pending') {
        payment.status = 'completed';
        console.log('[SIMULATION] Payment auto-completed:', checkoutRequestId);
      }
    }, 3000);
    
    return {
      MerchantRequestID: merchantRequestId,
      CheckoutRequestID: checkoutRequestId,
      ResponseCode: '0',
      ResponseDescription: 'Success. Request accepted for processing',
      CustomerMessage: '[SIMULATION] Payment prompt sent to your phone. Enter PIN to confirm.',
    };
  }
  
  // REAL M-PESA API
  try {
    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);
    const shortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;
    
    if (!shortCode || !callbackUrl) {
      throw new Error('M-Pesa configuration incomplete: Missing shortCode or callbackUrl');
    }
    
    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(request.amount),
      PartyA: formattedPhone,
      PartyB: shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: request.accountReference.slice(0, 12),
      TransactionDesc: request.transactionDesc.slice(0, 13),
    };
    
    console.log('Initiating M-Pesa STK Push:', { 
      phone: formattedPhone, 
      amount: request.amount,
      shortCode,
      callbackUrl: callbackUrl.substring(0, 50) + '...',
    });
    
    const response = await axios.post(
      `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('M-Pesa STK Push response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('M-Pesa STK Push Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    const errorMessage = error.response?.data?.errorMessage 
      || error.response?.data?.error_description 
      || error.message 
      || 'Failed to initiate M-Pesa payment';
    throw new Error(errorMessage);
  }
};

export interface STKQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

export const querySTKPushStatus = async (checkoutRequestId: string): Promise<STKQueryResponse> => {
  // SIMULATION MODE
  if (isSimulationMode() || checkoutRequestId.startsWith('SIM_')) {
    console.log('[SIMULATION] Querying simulated payment status:', checkoutRequestId);
    
    const payment = simulatedPayments.get(checkoutRequestId);
    
    if (!payment) {
      // If not found, assume completed (for older simulated payments)
      return {
        ResponseCode: '0',
        ResponseDescription: 'The service request has been accepted successfully',
        MerchantRequestID: `SIM_MR_${Date.now()}`,
        CheckoutRequestID: checkoutRequestId,
        ResultCode: '0',
        ResultDesc: '[SIMULATION] The service request is processed successfully.',
      };
    }
    
    if (payment.status === 'completed') {
      return {
        ResponseCode: '0',
        ResponseDescription: 'The service request has been accepted successfully',
        MerchantRequestID: `SIM_MR_${Date.now()}`,
        CheckoutRequestID: checkoutRequestId,
        ResultCode: '0',
        ResultDesc: '[SIMULATION] The service request is processed successfully.',
      };
    } else if (payment.status === 'failed') {
      return {
        ResponseCode: '0',
        ResponseDescription: 'The service request has been accepted successfully',
        MerchantRequestID: `SIM_MR_${Date.now()}`,
        CheckoutRequestID: checkoutRequestId,
        ResultCode: '1032',
        ResultDesc: '[SIMULATION] Request cancelled by user',
      };
    } else {
      // Still pending
      return {
        ResponseCode: '0',
        ResponseDescription: 'The service request has been accepted successfully',
        MerchantRequestID: `SIM_MR_${Date.now()}`,
        CheckoutRequestID: checkoutRequestId,
        ResultCode: '1',
        ResultDesc: '[SIMULATION] The transaction is being processed',
      };
    }
  }
  
  // REAL M-PESA API
  try {
    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);
    const shortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
    
    console.log('Querying M-Pesa STK Push status:', { checkoutRequestId });
    
    const response = await axios.post(
      `${getBaseUrl()}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('M-Pesa STK Query response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('M-Pesa STK Query Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw new Error(`Failed to query M-Pesa payment status: ${error.message}`);
  }
};

// Get simulated receipt number for completed payments
export const getSimulatedReceiptNumber = (checkoutRequestId: string): string | null => {
  if (checkoutRequestId.startsWith('SIM_')) {
    const payment = simulatedPayments.get(checkoutRequestId);
    if (payment && payment.status === 'completed') {
      return generateSimulatedReceipt();
    }
  }
  return null;
};

export interface MPesaCallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

export const parseCallbackData = (data: MPesaCallbackData) => {
  const callback = data.Body.stkCallback;
  const isSuccess = callback.ResultCode === 0;
  
  let amount: number | undefined;
  let mpesaReceiptNumber: string | undefined;
  let transactionDate: string | undefined;
  let phoneNumber: string | undefined;
  
  if (isSuccess && callback.CallbackMetadata) {
    for (const item of callback.CallbackMetadata.Item) {
      switch (item.Name) {
        case 'Amount':
          amount = Number(item.Value);
          break;
        case 'MpesaReceiptNumber':
          mpesaReceiptNumber = String(item.Value);
          break;
        case 'TransactionDate':
          transactionDate = String(item.Value);
          break;
        case 'PhoneNumber':
          phoneNumber = String(item.Value);
          break;
      }
    }
  }
  
  return {
    success: isSuccess,
    merchantRequestId: callback.MerchantRequestID,
    checkoutRequestId: callback.CheckoutRequestID,
    resultCode: callback.ResultCode,
    resultDesc: callback.ResultDesc,
    amount,
    mpesaReceiptNumber,
    transactionDate,
    phoneNumber,
  };
};
