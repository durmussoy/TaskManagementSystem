const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin middleware - sadece admin kullanıcıların erişebileceği endpoint'ler için
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).populate('role');
    console.log('Admin check - User:', user); // Debug için
    console.log('Admin check - Role:', user?.role); // Debug için
    
    if (!user.role || user.role.name.toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user (Auth + Admin required)
router.put('/:userId', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('Update user request:', req.body); // Debug için
    const { userId } = req.params;
    const { username, name, password } = req.body;

    // Kullanıcıyı bul
    const user = await User.findById(userId).populate('role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Username değişmişse ve başka bir kullanıcı tarafından kullanılıyorsa kontrol et
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    // Güncelleme verilerini hazırla
    const updateData = {
      username: username || user.username,
      name: name || user.name,
      role: user.role // Mevcut rolü koru
    };

    // Şifre değişmişse ekle
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    console.log('Update data:', updateData); // Debug için

    // Kullanıcıyı güncelle
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('role', 'name description');

    console.log('User updated successfully:', updatedUser); // Debug için
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (Only Admin)
router.get('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password')
      .populate('role', 'name description')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId, '-password')
      .populate('role', 'name description');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// User Registration
router.post('/register', async (req, res) => {
  try {
    console.log('Register request received:', req.body);
    const { username, password, name } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ username });
    if (userExists) {
      console.log('Username already exists:', username);
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Get default role (User)
    const defaultRole = await Role.findOne({ name: 'User' });
    if (!defaultRole) {
      return res.status(500).json({ message: 'Default role not found' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      username,
      password: hashedPassword,
      name,
      role: defaultRole._id
    });

    await user.save();
    console.log('New user created:', username);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username }).populate('role', 'name');
    console.log('Found user:', user); // Debug için
    console.log('User role details:', user?.role); // Debug için

    if (!user) {
      console.log('User not found:', username);
      return res.status(400).json({ message: 'User not found' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch); // Debug için

    if (!isMatch) {
      console.log('Invalid password:', username);
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const userData = {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role?.name || 'User'
    };

    console.log('Generated token:', token); // Debug için
    console.log('User data being sent:', userData); // Debug için
    
    res.json({
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role (Auth + Admin required)
router.put('/:userId/role', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('Update role request:', req.body); // Debug için
    const { roleName } = req.body;
    const { userId } = req.params;

    console.log('Searching for role:', roleName); // Debug için

    // Rol kontrolü
    const role = await Role.findOne({ 
      name: { $regex: new RegExp(`^${roleName}$`, 'i') } 
    });
    
    console.log('Found role:', role); // Debug için

    if (!role) {
      return res.status(400).json({ 
        message: 'Invalid role name',
        availableRoles: ['User', 'Admin'],
        requestedRole: roleName
      });
    }

    // Kullanıcı kontrolü
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Rolü güncelle
    user.role = role._id;
    await user.save();
    console.log('User role updated successfully to:', role.name); // Debug için

    const updatedUser = await User.findById(userId)
      .select('-password')
      .populate('role', 'name description');

    res.json({ 
      message: 'User role updated successfully', 
      user: updatedUser,
      newRole: role.name
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update own profile (Any authenticated user)
router.put('/profile/update', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, password } = req.body;

    // Kullanıcıyı bul
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Güncelleme verilerini hazırla
    const updateData = {
      name: name || user.name
    };

    // Şifre değişmişse ekle
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    console.log('Profile update data:', updateData); // Debug için

    // Kullanıcıyı güncelle
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('role', 'name description');

    console.log('Profile updated successfully:', updatedUser); // Debug için
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 