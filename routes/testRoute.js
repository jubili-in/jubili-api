const express = require('express');
const router = express.Router();

const ddbDocClient = require('../config/dynamoDB');
const { ListTablesCommand } = require('@aws-sdk/client-dynamodb');

router.get('/test-dynamo', async (req, res) => {
    try {
        const { TableNames } = await ddbDocClient.send(new ListTablesCommand({}));
        res.status(200).json({ tables: TableNames });
    } catch (err) {
        console.error("DynamoDB Test Error:", err);
        res.status(500).send("Failed to connect to DynamoDB");
    }
});

module.exports = router;
