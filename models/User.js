import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  contact: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['client', 'admin'],
    default: 'client',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  phone: { type: String, default: '' },
  company: { type: String, default: '' },
  country: { type: String, default: '' },
  city: { type: String, default: '' },
  projectExperience: { type: String, default: '' },
  contactMethod: {
    type: String,
    enum: ['email', 'phone', 'whatsapp'],
    default: 'email'
  },
  budgetPreference: { type: String, default: '' }
});

const User = mongoose.model('User', userSchema);

export default User;