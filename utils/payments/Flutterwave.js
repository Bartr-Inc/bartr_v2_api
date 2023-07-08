const axios = require("axios");

const initializeTransaction = async (params) => {
    const config = {
        method: "POST",
        url: `${process.env.FLUTTERWAVE_PAYMENT_HOST}/payments`,
        headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            "Content-Type": "application/json",
        },
        data: params,
    };

    const response = await axios(config);
    return response;
};

const verifyTransaction = async (transactionId) => {
    const config = {
        method: "GET",
        url: `${process.env.FLUTTERWAVE_PAYMENT_HOST}/transactions/${transactionId}/verify`,
        headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            "Content-Type": "application/json",
        },
    };

    const response = await axios(config);
    return response;
};

const fetchBanks = async () => {
    const config = {
        method: "GET",
        url: `${process.env.FLUTTERWAVE_PAYMENT_HOST}/banks/NG`,
        headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            "Content-Type": "application/json",
        },
    };

    const response = await axios(config);
    return response;
};

const verifyBankAccount = async (params) => {
    const config = {
        method: "POST",
        url: `${process.env.FLUTTERWAVE_PAYMENT_HOST}/accounts/resolve`,
        headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            "Content-Type": "application/json",
        },
        data: params,
    };

    const response = await axios(config);
    return response;
};

const transferFunds = async (params) => {
    const config = {
        method: "POST",
        url: `${process.env.FLUTTERWAVE_PAYMENT_HOST}/transfers`,
        headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            "Content-Type": "application/json",
        },
        data: params,
    };

    const response = await axios(config);
    return response;
};

module.exports = {
    initializeTransaction,
    verifyTransaction,
    fetchBanks,
    verifyBankAccount,
    transferFunds
};
