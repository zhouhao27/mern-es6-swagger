'use strict'
import jwt from 'jwt-simple'

// Check for a token in the custom header setting and verify that it is
// signed and has not been tampered with
// If no header token is present, maybe the user
// The JWT Simple package will throw exceptions
module.exports.checkAuth = function(req,res,next) {
  // TODO: nothing inside req.headers['x-auth']
  if (req.headers['x-auth']) {
    try {
      req.auth = jwt.decode(req.headers['x-auth'], process.env.JWT_SECRET)
      if (req.auth && req.auth.authorized && req.auth.userId) {
        return next()
      } else {
        return next(new Error('User is not logged in.'))
      }
    } catch (err) {
      return next(err)
    }
  } else {
    return next(new Error('User is not logged in.'))
  }
}
/*
export default function(req,res,next) {
  if (req.headers['x-auth']) {
    try {
      req.auth = jwt.decode(req.headers['x-auth'], process.env.JWT_SECRET)
      if (req.auth && req.auth.authorized && req.auth.userId) {
        return next()
      } else {
        return next(new Error('User is not logged in.'))
      }
    } catch (err) {
      return next(err)
    }
  } else {
    return next(new Error('User is not logged in.'))
  }
} */