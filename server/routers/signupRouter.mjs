import express from 'express';
import uuidv4 from 'uuid/v4.js';
import emailMgr from '../resourceMgrs/emailManager.mjs';
import bcrypt from 'bcrypt';
// import slowDown from 'express-slow-down';
import rateLimit from 'express-rate-limit';

import {
  toSQLDateTime,
  isPopulated,
  isEmailValid,
  passwordPolicy
} from '../util/util.mjs';
import logger from '../resourceMgrs/logger.mjs';
import dbMgr from '../resourceMgrs/dbManager.mjs';

var router = express.Router();

/**
 * @module server/routers/signupRouter
 */

// limiters
// signup - post - slowdown plus hard limit
// const slowDownLimiter = slowDown({
//   windowMs: 15 * 60 * 1000,
//   delayAfter: 3,
//   delayMs: 500
// });

const limiterSignUp = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  handler: function(req, res, options) {
    logger.error('password signup limiter error');
    var error = `Hi, sorry for the inconvenience, but for security reasons we 
      have to limit sign up attempts.  Please try again in a little while.`;
    var errorCode = 6;
    var data = {};
    res.json({ error, errorCode, data });
  }
});

// password verify limiter
const limiterVerify = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  handler: function(req, res, options) {
    logger.error('password verify limiter error');
    res.redirect('/signup?status=6');
  }
});

/**
 * @description Verify user's registration.  User will be coming in via
 * clicking the link in the email, so we process
 * that logic here, and then redirect back to to the login page if all
 * went well, otherwise back to the sign up page
 * @function GET /verify
 */
router.get('/verify', limiterVerify, async (req, res) => {
  // if good, redirect to login, else back to sign up
  var username = req.query.username;
  var token = req.query.token;
  logger.info(`/verify: username=${username} token=${token}`);

  // field validation
  if (!isPopulated(username)) {
    res.redirect('/signup?status=2');
  } else if (!isEmailValid(username)) {
    res.redirect('/signup?status=2');
  } else if (!isPopulated(token)) {
    res.redirect('/signup?status=2');
  } else {
    // validation good, now check token
    try {
      var conn = await dbMgr.getConn();
      var result = await conn.query(
        'SELECT * FROM pending_user_tokens WHERE username=? AND token=?',
        [username, token]
      );
      if (!result.length) {
        // although we could check if the username or email exist, that could
        // expose a vector for someone to check if that account is registered
        res.redirect('/signup?status=3');
        return;
      } else if (new Date() > new Date(result['expiry_datetime'])) {
        // token has expired
        await conn.query('DELETE FROM pending_user_tokens WHERE username=?', [
          username
        ]);

        // an nicer approach may be to re-add entry to pending_user_tokens and
        // re-send the verification token, but for now we will ask the user to
        // sign up again
        res.redirect('/signup?status=4');
        return;
      } else {
        // all good
        var { pw } = result[0];
        await conn.query(
          'INSERT INTO users (username, email, pw) values (?,?,?)',
          [username, username, pw]
        );

        await conn.query(
          'DELETE FROM pending_user_tokens WHERE username=?',
          username
        );
        res.redirect('/login?status=1');
      }
    } catch (err) {
      logger.error(`error: ${err}`);
      res.redirect('/signup?status=5');
    } finally {
      conn.release();
    }
  }
});

/**
 * @description Endpoint for signup request
 * @function POST /
 */
router.post('/', limiterSignUp, async (req, res) => {
  logger.info(`post /signup, req.body.username=${req.body.username}`);
  // response json
  var error = null,
    errorCode = 0,
    data = {};
  // input data
  var username = req.body.username;
  var password = req.body.password;

  if (!username || !password) {
    error = 'Invalid username or password';
    errorCode = 2;
  } else if (!isEmailValid(username)) {
    error = 'Invalid username, must be email address when signing up';
    errorCode = 3;
  } else if (!passwordPolicy(password)) {
    error = 'Invalid password, must be at least ten characters';
    errorCode = 4;
  } else {
    try {
      var conn = await dbMgr.getConn();
      var email = await conn.query(
        'SELECT email FROM users WHERE email=? OR username=?',
        [username, username]
      );
      if (email.length) {
        // does username (or email) exist in database?
        // if so, send email to user indicating error
        logger.warn('username already exists in database');

        emailMgr.sendEmail(username, 'signup-account-exists', {});
        data = 'Success'; // mock success
      } else {
        // ok, looking good so far, now have to encrypt pw,
        // then save to pending db, and send user email
        var token = uuidv4();
        var link = `${process.env.APP_EMAIL_VERIFYLINK}?username=${username}&token=${token}`;
        var expiryDate = toSQLDateTime(24 * 60 * 60); // 1 day

        const saltRounds = 10;
        var hashPw = await bcrypt.hash(password, saltRounds);

        await conn.query(
          `INSERT INTO pending_user_tokens
                    (username, email, pw, token, expiry_datetime)
                    VALUES (?,?,?,?,?)`,
          [username, username, hashPw, token, expiryDate]
        );
        data = 'Success';
        emailMgr.sendEmail(username, 'signup', { link });
      }
    } catch (err) {
      logger.error(`error: ${err}`);
      error = 'Internal problem on our end reading from the database';
      errorCode = 5;
    } finally {
      conn.release();
    }
  }

  res.json({ error, errorCode, data });
});

export default router;
