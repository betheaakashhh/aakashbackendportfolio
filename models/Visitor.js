import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  count: {
    type: Number,
    default: 0,
    required: true
  },
  lastVisited: {
    type: Date,
    default: Date.now
  },
  // Optional: Track unique visitors if needed
  uniqueVisitors: [{
    ip: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    userAgent: String
  }]
}, {
  timestamps: true
});

const Visitor = mongoose.model('Visitor', visitorSchema);

export default Visitor;