import axios from 'axios';

const SANDBOX_BASE_URL = 'https://sandbox.safaricom.co.ke';
const PRODUCTION_BASE_URL = 'https://api.safaricom.co.ke';

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

export const getAccessToken = async (): Promise<string> => {
  try {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    
    if (!consumerKey || !consumerSecret) {
      throw new Error('M-Pesa credentials not configured');
    }
    
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    const response = await axios.get(
      `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    
    return response.data.access_token;
  } catch (error: any) {
    console.error('Error getting M-Pesa access token:', error.response?.data || error.message);
    throw new Error('Failed to get M-Pesa access token');
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
  try {
    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);
    const formattedPhone = formatPhoneNumber(request.phone);
    const shortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;
    
    if (!shortCode || !callbackUrl) {
      throw new Error('M-Pesa configuration incomplete');
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
    
    console.log('Initiating M-Pesa STK Push:', { phone: formattedPhone, amount: request.amount });
    
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
    console.error('M-Pesa STK Push Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || 'Failed to initiate M-Pesa payment');
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
  try {
    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);
    const shortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
    
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
    
    return response.data;
  } catch (error: any) {
    console.error('M-Pesa STK Query Error:', error.response?.data || error.message);
    throw new Error('Failed to query M-Pesa payment status');
  }
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
