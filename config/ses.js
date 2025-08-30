//File: config/ses.js

const { SESClient } = require("@aws-sdk/client-ses");

const sesClient = new SESClient({
    region: process.env.SES_REGION || process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

module.exports = { sesClient };