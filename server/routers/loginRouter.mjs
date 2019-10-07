import express from 'express';
import bcrypt from 'bcrypt';
import slowDown from 'express-slow-down';
import rateLimit from 'express-rate-limit';

import dbMgr from '../resourceMgrs/dbManager.mjs';
import logger from '../resourceMgrs/logger.mjs';
import util from 'util';

// slow down after 3 attempts
const slowDownLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 3,
  delayMs: 500
});

// hard limit - 8 requests per 15 min for login
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  handler: function(req, res, options) {
    logger.error(`password signup limiter error`);
    var error = `Hi, would a password reset help?  Otherwise, sorry 
    for the inconvenience, but please try again in a little while.`;
    var errorCode = 3;
    var data = {};
    res.json({ error, errorCode, data });
  }
});

/**
 * @module server/routers/loginRouter
 */

var router = express.Router();

/**
 * @description Endpoint for login
 * @function POST /
 */
router.post('/', slowDownLimiter, limiter, async (req, res) => {
  logger.info(`/login POST, req.body.username=${req.body.username}`);
  var error = null,
    errorCode = 0,
    data = {};
  try {
    var conn = await dbMgr.getConn();
    var result = await conn.query(
      'SELECT username,pw,id FROM users WHERE username=?',
      req.body.username
    );
    if (!result.length) {
      // username not in database, but don't convey this fact to prevent
      // username sniffing
      error = 'Invalid username or password';
      errorCode = 1;
    } else {
      var { username, id: userid, pw } = result[0];
      const match = await bcrypt.compare(req.body.password, pw);
      if (match) {
        req.session.username = username;
        req.session.userid = userid;
        var sessionSave = util.promisify(req.session.save).bind(req.session);
        await sessionSave();
        data = 'Success';
      } else {
        // bad password
        error = 'Invalid username or password';
        errorCode = 1;
      }
    }
  } catch (err) {
    logger.error(`error: ${err}`);
    error = 'Internal problem on our end reading from the database';
    errorCode = 2;
  } finally {
    conn.release();
  }

  res.json({ error, errorCode, data });
});

export default router;
