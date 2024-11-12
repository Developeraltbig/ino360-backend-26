// backend/models/login.js
const bcrypt = require('bcryptjs');
const Registration = require('./Registration'); // Import Registration model

// Function to authenticate the user during login
const loginUser = async (email, password) => {
  try {
    // Check if user exists
    const user = await Registration.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Compare password with hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Return user details if credentials match
    return user; // Return the user object (you can return any info here)
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  loginUser,
};
