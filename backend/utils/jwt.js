// jwt utility functions
// handles token generation and verification

const jwt = require('jsonwebtoken');

// generate jwt token for user
const generateToken = (userId, role) => {
  const payload = {
    userId,
    role
  };
  
  // create token with 30 days expiration
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  
  return token;
};

// verify jwt token
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

module.exports = {
  generateToken,
  verifyToken
};
