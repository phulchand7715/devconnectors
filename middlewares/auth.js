const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
  //Get token
  const token = req.header("x-auth-token");

  //token empty
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied!" });
  }

  //verify token
  try {
    const decoded = jwt.verify(token, config.get("jwtsecret"));

    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ msg: "Invalid Token, Access Denied!" });
  }
};
