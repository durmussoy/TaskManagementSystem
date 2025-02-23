const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Token'ı header'dan al
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Yetkilendirme token\'ı bulunamadı' });
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // User bilgisini request'e ekle
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Auth middleware hatası:', error);
    res.status(401).json({ message: 'Geçersiz token' });
  }
}; 