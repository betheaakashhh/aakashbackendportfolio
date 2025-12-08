// middleware/deviceTrack.js
export const trackDevice = (req, res, next) => {
  const deviceId = req.headers["x-device-id"]; // Frontend must send this
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];

  req.deviceInfo = {
    deviceId: deviceId || null,
    ip,
    userAgent
  };

  next();
};
