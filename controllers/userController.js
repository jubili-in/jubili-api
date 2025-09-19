//controllers/userCController.js
const { getUserByEmailOrPhone, createUser, createGoogleUser } = require('../services/userService');
const { sendVerificationEmail } = require('../services/emailService');
const { getGoogleAuthURL, getGoogleUser } = require('../config/googleOAuth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const signup = async (req, res) => {
  const { fullname, email, phone, password } = req.body;

  try {
    // Validation
    if (!email || !fullname || !password || password.length < 6) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    // Check if user already exists by email OR phone
    const existing = await getUserByEmailOrPhone(email, phone);

    if (existing.length > 0) {
      return res.status(400).json({ message: 'User with this email or phone already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create JWT token with user data (10 minutes expiry)
    const verificationPayload = {
      fullname,
      email,
      phone,
      password: hashedPassword,
      exp: Math.floor(Date.now() / 1000) + (10 * 60) // 10 minutes
    };

    const verificationToken = jwt.sign(verificationPayload, process.env.JWT_SECRET);

    // Send verification email
    await sendVerificationEmail(email, fullname, verificationToken);

    res.status(200).json({ 
      message: 'Verification email sent successfully. Please check your email and click the verification link to complete registration.',
      email: email
    });

  } catch (e) {
    console.error('Signup error:', e);
    if (e.message === 'Failed to send verification email') {
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    // Verify and decode the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { fullname, email, phone, password } = decoded;

    // Check again if user already exists (in case they tried multiple times)
    const existing = await getUserByEmailOrPhone(email, phone);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists and is verified' });
    }

    // Create user in database
    const newUser = await createUser({
      name: fullname,
      email,
      phone,
      password
    });

    // Generate login token
    const loginPayload = { user: { id: newUser.userId } };
    const loginToken = jwt.sign(loginPayload, process.env.JWT_SECRET);

    // Set cookie
    res.cookie('token', loginToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({ 
      message: 'Email verified successfully! You are now logged in.',
      user: {
        userId: newUser.userId,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone
      },
      token: loginToken
    });

  } catch (e) {
    console.error('Email verification error:', e);
    
    if (e.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Verification link has expired. Please sign up again.' });
    }
    
    if (e.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Invalid verification link. Please sign up again.' });
    }

    res.status(500).json({ message: 'Email verification failed' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.query;

  try {
    const users = await getUserByEmailOrPhone(email, null);
    const user = users[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = { user: { id: user.userId } };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days (changed from 30 seconds)
    }); 

    res.status(200).json({ 
      message: 'Login successful', 
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone
      }, 
      token 
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ message: e.message });
  }
};

// Google OAuth handlers
const initiateGoogleAuth = (req, res) => {
  try {
    const authUrl = getGoogleAuthURL();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Google auth initiation error:', error);
    res.status(500).json({ message: 'Failed to initiate Google authentication' });
  }
};

const handleGoogleCallback = async (req, res) => {
  const { code, error } = req.query;

  try {
    if (error) {
      return res.status(400).json({ message: 'Google authentication failed', error });
    }

    if (!code) {
      return res.status(400).json({ message: 'Authorization code missing' });
    }

    // Get user info from Google
    const googleUser = await getGoogleUser(code);
    
    if (!googleUser.email) {
      return res.status(400).json({ message: 'Failed to get user email from Google' });
    }

    // Check if user exists
    const existingUsers = await getUserByEmailOrPhone(googleUser.email, null);
    let user;

    if (existingUsers.length > 0) {
      // User exists, log them in
      user = existingUsers[0];
    } else {
      // Create new user
      user = await createGoogleUser({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.id,
        picture: googleUser.picture
      });
    }

    // Generate JWT token (same format as normal login)
    const payload = { user: { id: user.userId } };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    // Set cookie (same as normal login)
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Redirect to frontend with success, passing user data in a way that matches normal login
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const userDataQuery = encodeURIComponent(JSON.stringify({
      userId: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone
    }));
    res.redirect(`${frontendUrl}/login-success?token=${token}&user=${userDataQuery}`);

  } catch (error) {
    console.error('Google callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login-error?message=Authentication failed`);
  }
};

module.exports = { login, signup, verifyEmail, initiateGoogleAuth, handleGoogleCallback };
