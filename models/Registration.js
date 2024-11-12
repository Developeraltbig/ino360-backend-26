const mongoose = require('mongoose');

// Define the Registration schema
const registrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // Enforcing a minimum length for passwords
  },
}, { timestamps: true });

// Create the Registration model
const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
