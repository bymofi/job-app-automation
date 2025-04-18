const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Config } = require('./database');

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// Register a new user
async function register(userData) {
  try {
    const { username, email, password, firstName, lastName } = userData;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      throw new Error('Username or email already exists');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Get or create default config
    let config = await Config.findOne();
    if (!config) {
      config = new Config({
        keywords: ['Financial Analyst', 'Business Analyst', 'Budget Analyst', 'ERP Business Analyst'],
        locations: ['Canada', 'Remote'],
        autoApplyThreshold: 80,
        autoApplyEnabled: false,
        platforms: ['LinkedIn', 'Indeed', 'Glassdoor', 'FuzeHR', 'Quantum', 'Canada Job Bank']
      });
      await config.save();
    }
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      settings: config._id
    });
    
    await newUser.save();
    return { success: true, message: 'User registered successfully' };
  } catch (error) {
    throw error;
  }
}

// Login user
async function login(credentials) {
  try {
    const { username, password } = credentials;
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const payload = {
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    
    return {
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    };
  } catch (error) {
    throw error;
  }
}

// Verify token middleware
function verifyToken(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token, authorization denied' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user from payload to request
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
}

// Get user profile
async function getUserProfile(userId) {
  try {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    throw error;
  }
}

// Update user profile
async function updateUserProfile(userId, userData) {
  try {
    const { firstName, lastName, email } = userData;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    
    await user.save();
    return { success: true, message: 'Profile updated successfully', user };
  } catch (error) {
    throw error;
  }
}

// Change password
async function changePassword(userId, passwordData) {
  try {
    const { currentPassword, newPassword } = passwordData;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  register,
  login,
  verifyToken,
  getUserProfile,
  updateUserProfile,
  changePassword
};
