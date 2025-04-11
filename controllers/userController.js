const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// DynamoDB config
AWS.config.update({
  region: 'ap-south-1', // your selected region (Mumbai)
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'Users'; // DynamoDB table name

const login = async (req, res) => {
  const { email, password } = req.query;

  try {
    // Query user by email using Scan (since we have no index on email)
    const result = await dynamoDB.scan({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
    }).promise();

    const user = result.Items[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Wrong password' });

    const payload = { user: { id: user.userId } };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 3600000,
    });

    res.status(200).json({ message: 'Hello User', user, token });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ message: e.message });
  }
};

const signup = async (req, res) => {
  const { fullname, email, phone, password } = req.body;

  try {
    if (!email || !fullname || !password || password.length < 6) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    // Check if user already exists by email
    const existing = await dynamoDB.scan({
      TableName: USERS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
    }).promise();

    if (existing.Items.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4(); // generate unique user ID

    const newUser = {
      userId,
      name: fullname,
      email,
      phone,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    await dynamoDB.put({
      TableName: USERS_TABLE,
      Item: newUser,
    }).promise();

    const payload = { user: { id: userId } };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 3600000,
    });

    res.status(200).json({ message: 'success', user: newUser, token });
  } catch (e) {
    console.error('Signup error:', e);
    res.status(500).json({ message: e.message });
  }
};

module.exports = { login, signup };
