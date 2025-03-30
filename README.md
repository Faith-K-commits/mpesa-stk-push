# M-Pesa STK Push API Integration

This repository contains a Node.js implementation of Safaricom's M-Pesa STK Push (Lipa Na M-Pesa Online) API using Express. It allows businesses to initiate payment requests directly to customers' phones and receive transaction status updates.

## Features

- M-Pesa STK Push initiation
- Transaction callback handling
- Phone number formatting
- Access token generation
- Secure password generation
- Environment-based configuration

## Prerequisites

- Node.js and npm installed
- Safaricom Daraja API account
- M-Pesa Sandbox credentials (for testing)
- A publicly accessible URL for callback (ngrok recommended for development)

## Getting Started

### 1. Clone the repository

```bash
git clone git@github.com:Faith-K-commits/mpesa-stk-push.git
cd mpesa-stk-push
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root and add the following:

```
CONSUMER_KEY=your_consumer_key_here
CONSUMER_SECRET=your_consumer_secret_here
BUSINESS_SHORT_CODE=174379  # Default sandbox shortcode
PASS_KEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919  # Default sandbox passkey
CALLBACK_URL=https://your-callback-url.com/api/mpesa/callback
```

### 4. Start the server

```bash
npm start
```

### 5. Expose your local server (for testing)

To receive callbacks from Safaricom, your server needs to be publicly accessible. For development, you can use ngrok:

```bash
npm install -g ngrok
ngrok http 3000
```

Then update your `.env` file with the ngrok URL:

```
CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/mpesa/callback
```

## API Endpoints

### Initiate STK Push

```
POST /api/mpesa/stk-push
```

Request body:
```json
{
  "phoneNumber": "254712345678",
  "amount": "1"
}
```

Response:
```json
{
  "success": true,
  "message": "STK Push initiated successfully",
  "data": {
    "MerchantRequestID": "29115-34620561-1",
    "CheckoutRequestID": "ws_CO_191220191020363925",
    "ResponseCode": "0",
    "ResponseDescription": "Success. Request accepted for processing",
    "CustomerMessage": "Success. Request accepted for processing"
  }
}
```

### Callback URL

```
POST /api/mpesa/callback
```

This endpoint receives transaction status updates from Safaricom. The structure of the incoming data is:

```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "29115-34620561-1",
      "CheckoutRequestID": "ws_CO_191220191020363925",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {
            "Name": "Amount",
            "Value": 1.00
          },
          {
            "Name": "MpesaReceiptNumber",
            "Value": "LHG31AA5TX"
          },
          {
            "Name": "TransactionDate",
            "Value": 20191219102115
          },
          {
            "Name": "PhoneNumber",
            "Value": 254712345678
          }
        ]
      }
    }
  }
}
```

## How It Works

1. **Authentication**: The app authenticates with Safaricom's API using OAuth 2.0 to obtain an access token.
2. **STK Push Initiation**: When a payment request is made, the app generates a secure password, formats the phone number, and sends the request to Safaricom.
3. **Customer Interaction**: The customer receives a payment prompt on their phone to confirm the transaction.
4. **Callback Processing**: Safaricom sends the transaction status to the callback URL, which the app processes to determine if the payment was successful.

## Security Considerations

- **Environment Variables**: Sensitive data like API keys are stored in environment variables.
- **Password Generation**: A secure password is generated for each request using the business shortcode, passkey, and current timestamp.
- **HTTPS**: In production, always use HTTPS for your callback URL.

## Sandbox Testing

For sandbox testing, use the following test credentials:

- **Phone Number**: 254708374149
- **Test Amount**: Any amount
- **Test PIN**: 174379

## Going to Production

To move to the production environment:

1. Apply for production credentials from Safaricom
2. Update the API endpoints from sandbox to production
3. Update your environment variables with production credentials
4. Ensure your callback URL is secure (HTTPS)
5. Implement proper error handling and logging
6. Set up a database to track transactions

## Troubleshooting

- **Authentication Errors**: Verify your Consumer Key and Secret are correct.
- **Callback Issues**: Ensure your server is publicly accessible and the callback URL is correctly configured.
- **Phone Number Format**: The API requires the format 254XXXXXXXXX (no + or leading 0).

## Acknowledgements

- [Safaricom Daraja API Documentation](https://developer.safaricom.co.ke/docs)