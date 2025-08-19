
// config/ekart.js
module.exports = {
    CLIENT_ID: process.env.EKART_CLIENT_ID,
    USERNAME: process.env.EKART_USERNAME,
    PASSWORD: process.env.EKART_PASSWORD,
    BASE_URL: process.env.EKART_BASE_URL || 'https://app.elite.ekartlogistics.in',
    TOKEN_EXPIRY_HOURS: 24
};