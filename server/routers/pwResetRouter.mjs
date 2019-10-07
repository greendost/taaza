import express from 'express';
import uuidv4 from 'uuid/v4.js';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';

import { isEmailValid, toSQLDateTime, passwordPolicy } from '../util/util.mjs';
import dbMgr from '../resourceMgrs/dbManager.mjs';
import emailMgr from '../resourceMgrs/emailManager.mjs';
import logger from '../resourceMgrs/logger.mjs';

/**
 * @module server/routers/pwResetRouter
 */

var router = express.Router();

// limiters
// password reset verify limiter
const limiterVerify = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  handler: function(req, res, options) {
    logger.error('password verify limiter error');
    var error = `Hi, sorry for the inconvenience, but for security reasons we 
    have to limit password reset attempts.  Please try again in a little while.`;
    var errorCode = 6;
    var data = { redirect: '/pwresetrequest' };
    res.json({ error, errorCode, data });
    // res.redirect('/signup?status=6');
  }
});

const limiterResetRequest = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  handler: function(req, res, options) {
    logger.error('password signup limiter error');
    var error = `Hi, sorry for the inconvenience, but for security reasons we 
      have to limit password reset requests.  Please try again in a little while.`;
    var errorCode = 3;
    var data = {};
    res.json({ error, errorCode, data });
  }
});

/**
 * @description Endpoint for verifying updated password.  Note that
 * verify handles updated password post requests coming from client side
 * PWResetPage.  In the spirit of SPA, I made the decision to have the
 * client side handle the redirect; this contrasts from how sign up requests
 * are redirected on the server side
 * @function POST /verify
 */
router.post('/verify', limiterVerify, async (req, res) => {
  var error = null,
    errorCode = 0,
    data = {};

  var email = req.body.email;
  var token = req.body.token;
  var pw1 = req.body.password1;
  var pw2 = req.body.password2;

  // password policy check
  if (pw1.length !== pw2.length) {
    error =
      "Passwords don't match.  Please try putting in another password reset request";
    errorCode = 1;
    data = { redirect: '/pwresetrequest' };
  } else if (!passwordPolicy(pw1)) {
    error =
      'Password should be at least 10 characters.  Please try putting in another password reset request';
    errorCode = 2;
    data = { redirect: '/pwresetrequest' };
  } else {
    try {
      var conn = await dbMgr.getConn();
      var result = await conn.query(
        'SELECT username FROM pending_pwreset_tokens WHERE username=? AND token=?',
        [email, token]
      );
      if (!result.length) {
        await conn.query(
          'DELETE FROM pending_pwreset_tokens WHERE username=?',
          email
        );
        error =
          'We ran into a problem in resetting your password.  Please try again';
        errorCode = 3;
        data = { redirect: '/pwresetrequest' };
      } else if (result[0].username !== email) {
        await conn.query(
          'DELETE FROM pending_pwreset_tokens WHERE username=?',
          email
        );
        error =
          'We ran into a problem in resetting your password.  Please try again';
        errorCode = 4;
        data = { redirect: '/pwresetrequest' };
      } else {
        // all good
        // update password, delete token, and redirect user to login page
        const saltRounds = 10;
        var hashPw = await bcrypt.hash(pw1, saltRounds);
        await conn.query('UPDATE users SET pw = ? WHERE email = ?', [
          hashPw,
          email
        ]);
        await conn.query(
          'DELETE FROM pending_pwreset_tokens WHERE username=?',
          email
        );
        data = {
          redirect: '/login',
          message: 'Your password has been reset.  Please login'
        };
      }
    } catch (err) {
      logger.error(`error: ${err}`);
      error =
        'We ran into an unexpected problem.  Sorry for the inconvenience, but please try resetting your password later.';
      errorCode = 5;
      data = { redirect: '/pwresetrequest' };
    } finally {
      conn.release();
    }
  }
  res.json({ error, errorCode, data });
});

/**
 * @description Endpoint to handle password reset request
 * @function POST /request
 */
router.post('/request', limiterResetRequest, async (req, res) => {
  var error = null,
    errorCode = 0,
    data = {};
  // input data
  var email = req.body.email;

  if (!email || !isEmailValid(email)) {
    error = 'Problem with the email address.  Please correct';
    errorCode = 1;
  } else {
    try {
      // all good, create token in pending_pwreset_tokens and send email
      var conn = await dbMgr.getConn();
      var result = conn.query('SELECT email FROM users WHERE email = ?', email);
      if (!result) {
        // problem - no account registered with that email

        // should we still send an email letting user they do not have
        // an account with us?
        data = 'Success'; // mock success
      } else {
        var token = uuidv4();
        var expiryDate = toSQLDateTime(24 * 60 * 60); // 1 day
        var link = `${process.env.APP_EMAIL_PWRESET_VERIFYLINK}?email=${email}&token=${token}`;

        await conn.query(
          `INSERT INTO pending_pwreset_tokens
                    (username, token, expiry_datetime) VALUES (?,?,?)
                `,
          [email, token, expiryDate]
        );
        emailMgr.sendEmail(email, 'pwreset', { link });
        data = 'Success';
      }
    } catch (err) {
      logger.error(`error: ${err}`);
      error = 'Internal problem on our end reading from the database';
      errorCode = 2;
    } finally {
      conn.release();
    }
  }
  res.json({ error, errorCode, data });
});

export default router;
