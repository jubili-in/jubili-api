const { getUserByEmailOrPhone, createUser } = require('../services/userService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const signup = async (req, res) => {
  const { fullname, email, phone, password } = req.body;

  try {
    if (!email || !fullname || !password || password.length < 6) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    // Check if user already exists by email OR phone
    const existing = await getUserByEmailOrPhone(email, phone);

    if (existing.length > 0) {
      return res.status(400).json({ message: 'User with this email or phone already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await createUser({
      name: fullname,
      email,
      phone,
      password: hashedPassword
    });

    const payload = { user: { id: newUser.userId } };
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
      maxAge: 3600000,
    });

    res.status(200).json({ message: 'success', user, token });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ message: e.message });
  }
};

module.exports = { login, signup };
