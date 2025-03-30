const express = require('express');
const axios = require('axios');
const router = express.Router();

// Helper function to get the timestamp in YYYYMMDDHHmmss
const getTimestamp = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// Helper function to generate password
 const getPassword = (timestamp) => {
     const shortCode = process.env.BUSINESS_SHORT_CODE;
     const passKey = process.env.PASS_KEY;
     const password =`${shortCode}${passKey}${timestamp}`;

     return Buffer.from(password).toString('base64');
 };

 // Function to get Oauth token
const getAccessToken = async () => {
    try {
        const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
        const auth = Buffer.from(`${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`).toString('base64');

        const response = await axios.get(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
            }
        });
        return response.data.access_token;
    }catch(error) {
        console.error('Error getting access token:', error);
        throw error;
    }
};

// Route to initiate STK push
router.post('/stk-push', async (req, res) => {
    try {
        const {phoneNumber, amount} = req.body;

    //     Validate Inputs
        if(!phoneNumber || !amount) {
            return res.status(400).json({error: 'Phone number and amount are required'});
        }

    //     Formart phone number (remove leading zero or +254)
        let formattedPhoneNumber = phoneNumber;
        if(phoneNumber.startsWith('0')){
            formattedPhoneNumber = `254${phoneNumber.slice(1)}`;
        } else if (phoneNumber.startsWith('+254')){
            formattedPhoneNumber = phoneNumber.slice(1);
        }

    //     Get access token
        const accessToken = await getAccessToken();

    //     Prepare STK Push request
        const timestamp = getTimestamp();
        const password = getPassword(timestamp);
        const shortCode = process.env.BUSINESS_SHORT_CODE;

        const url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
        const data = {
            BusinessShortCode: shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: formattedPhoneNumber,
            PartyB: shortCode,
            PhoneNumber: formattedPhoneNumber,
            CallBackURL: process.env.CALLBACK_URL,
            AccountReference: 'Test Payment',
            TransactionDesc: 'Test Payment',
        };

    //     Make STK push request
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            }
        });

    //     Return response to client
        return res.json({
            success: true,
            message: 'STK push initiated successfully',
            data: response.data
        })
    }catch (error) {
        console.error('Error initiating STK Push:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to initiate STK Push',
            error: error.response?.data || error.message
        });
    }
});

// Callback route to receive STK push response
router.post('/callback', (req, res) => {
    console.log('STK Callback response:', JSON.stringify(req.body));

//     Extract info from callback
    const callbackData = req.body.Body.stkCallback;

//     Always respond to safaricom with a success to acknowledge receipt
    res.json({ResultCode: '0', ResultDesc: 'Success'});

//     Process the callback data as needed for your application
    if(callbackData.ResultCode === '0'){
    //     Payment successful
        const transactionDetails = callbackData.CallbackMetadata.Item;
    //     Process the successful payment
        console.log('Payment successful:', transactionDetails);
    } else {
    //     Payment failed
        console.log('Payment failed:', callbackData.ResultDesc);
    }
});

module.exports = router;