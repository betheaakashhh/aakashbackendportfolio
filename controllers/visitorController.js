import Visitor from '../models/Visitor.js';

// Track visitor and increment count
export const trackVisitor = async (req, res) => {
  try {
    // Get visitor info (optional)
    const visitorIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Find or create visitor document (we'll use a single document with ID for simplicity)
    let visitor = await Visitor.findOne();

    if (!visitor) {
      // Create first visitor record
      visitor = new Visitor({
        count: 1,
        uniqueVisitors: [{
          ip: visitorIP,
          userAgent: userAgent,
          timestamp: new Date()
        }]
      });
    } else {
      // Increment count
      visitor.count += 1;
      visitor.lastVisited = new Date();

      // Optional: Track unique visitor (you can add logic to check if IP already exists)
      visitor.uniqueVisitors.push({
        ip: visitorIP,
        userAgent: userAgent,
        timestamp: new Date()
      });
    }

    await visitor.save();

    res.status(200).json({
      success: true,
      count: visitor.count,
      message: 'Visitor tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking visitor:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking visitor',
      error: error.message
    });
  }
};

// Get current visitor count (optional endpoint)
export const getVisitorCount = async (req, res) => {
  try {
    const visitor = await Visitor.findOne();

    if (!visitor) {
      return res.status(200).json({
        success: true,
        count: 0
      });
    }

    res.status(200).json({
      success: true,
      count: visitor.count,
      lastVisited: visitor.lastVisited
    });

  } catch (error) {
    console.error('Error getting visitor count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting visitor count',
      error: error.message
    });
  }
};

// Optional: Get unique visitors count
export const getUniqueVisitors = async (req, res) => {
  try {
    const visitor = await Visitor.findOne();

    if (!visitor) {
      return res.status(200).json({
        success: true,
        uniqueCount: 0
      });
    }

    // Get unique IPs
    const uniqueIPs = [...new Set(visitor.uniqueVisitors.map(v => v.ip))];

    res.status(200).json({
      success: true,
      totalVisits: visitor.count,
      uniqueCount: uniqueIPs.length,
      uniqueVisitors: uniqueIPs.length
    });

  } catch (error) {
    console.error('Error getting unique visitors:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unique visitors',
      error: error.message
    });
  }
};
