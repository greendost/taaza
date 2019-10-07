import express from 'express';
import postMgr from '../resourceMgrs/postsManager.mjs';
import dbMgr from '../resourceMgrs/dbManager.mjs';
import logger from '../resourceMgrs/logger.mjs';

const router = express.Router();

/**
 * @module server/routers/apiRouter
 */

/**
 * @description Endpoint for getting all feeds
 * @function GET /feeds
 */
router.get('/feeds', async (req, res) => {
  var error = null,
    errorCode = 0,
    data = {};

  try {
    var conn = await dbMgr.getConn();
    var data = await conn.query(
      'SELECT id,name,description,url,favicon_file AS faviconFile FROM feeds'
    );
  } catch (err) {
    logger.error(`error: ${err}`);
    error = 'Problem reading from database';
    errorCode = 1;
  } finally {
    conn.release();
  }
  res.json({ error, errorCode, data });
});

/**
 * @description Endpoint for getting all user feeds
 * @function GET /userfeeds
 */
router.get('/userfeeds', async (req, res) => {
  var userid = req.session.userid;

  var error = null,
    errorCode = 0,
    data = {};
  try {
    var conn = await dbMgr.getConn();
    var data = await conn.query(
      `SELECT f.id,name,description,url,favorite_index, f.favicon_file AS faviconFile
            FROM user_feeds uf 
            LEFT JOIN feeds f 
            ON uf.feed_id = f.id 
            WHERE uf.user_id = ?`,
      userid
    );
  } catch (err) {
    logger.error(`error: ${err}`);
    res.json({ error: 'Problem reading from database' });
  } finally {
    conn.release();
  }
  res.json({ error, errorCode, data });
});

/**
 * @description Endpoint for subscribing to a feed
 * @function POST /userfeeds
 */
router.post('/userfeeds', async (req, res) => {
  var feedid = req.body.data;
  var userid = req.session.userid;

  var error = null,
    errorCode = 0,
    data = {};

  if (isNaN(feedid)) {
    error = 'request was made to add an invalid feed';
    errorCode = 1;
    res.json({ error, errorCode, data });
    return;
  }
  // check if feedid is valid
  if (!postMgr.getPosts()[feedid]) {
    error = 'request was made for a feed that does not exist or is not ready';
    errorCode = 2;
    res.json({ error, errorCode, data });
    return;
  }

  try {
    var conn = await dbMgr.getConn();
    await conn.query(
      'INSERT INTO user_feeds (id,user_id,feed_id) VALUES (null,?,?)',
      [userid, feedid]
    );
  } catch (err) {
    logger.error(`error: ${err}`);

    error = 'Problem with subscribing to this feed.  Please try again later';
    errorCode = 3;
  } finally {
    conn.release();
  }
  res.json({ error, errorCode, data });
});

/**
 * @description Endpoint for unsubscribing from a feed
 * @function DELETE /userfeeds/:feedid
 */
router.delete('/userfeeds/:feedid', async (req, res) => {
  var feedid = req.params.feedid;
  var userid = req.session.userid;

  var error = null,
    errorCode = 0,
    data = {};

  if (isNaN(feedid)) {
    var error = 'request was made to add an invalid feed';
    errorCode = 1;
    res.json({ error, errorCode, data });
    return;
  }
  // check if feedid is valid
  if (!postMgr.getPosts()[feedid]) {
    var error = 'request was made for a feed that does not exist';
    errorcode = 2;
    res.json({ error, errorCode, data });
    return;
  }
  try {
    var conn = await dbMgr.getConn();
    await conn.query('DELETE FROM user_feeds WHERE user_id=? AND feed_id=?', [
      userid,
      feedid
    ]);
  } catch (err) {
    logger.error(`error: ${err}`);
    error = 'Problem unsubscribing from feed.  Please try again later';
  } finally {
    conn.release();
  }
  res.json({ error, errorCode, data });
});

/**
 * @description Endpoint for setting favorite index of feed
 * (i.e. position in top feeds panel for frequently accessed feeds).
 * @function PATCH /userfeeds
 */
router.patch('/userfeeds', async (req, res) => {
  var feedid = req.body.feedid;
  var userid = req.session.userid;
  var newFavoriteIndex = req.body.favoriteIndex;

  var error = null,
    errorCode = 0,
    data = {};

  try {
    var conn = await dbMgr.getConn();
    await conn.query(
      'UPDATE user_feeds SET favorite_index = 0 WHERE user_id=? AND favorite_index=?',
      [userid, newFavoriteIndex]
    );
    await conn.query(
      'UPDATE user_feeds SET favorite_index = ? WHERE user_id=? AND feed_id=?',
      [newFavoriteIndex, userid, feedid]
    );
  } catch (err) {
    logger.error(`error: ${err}`);
    error = 'Problem on our end updating database.';
    errorCode = 1;
  } finally {
    conn.release();
  }
  res.json({ error, errorCode, data });
});

/**
 * @description Endpoint for getting all posts (ie entries) of a feed
 * @function POST /posts/:feedid
 */
router.get('/posts/:feedid', async (req, res) => {
  var feedid = req.params.feedid;
  var error = null,
    errorCode = 0,
    data = {};

  if (isNaN(feedid)) {
    error = 'request was made to add an invalid feed';
    errorCode = 1;
    res.json({ error, errorCode, data });
    return;
  }
  // check if feedid is valid
  if (!postMgr.getPosts()[feedid]) {
    error = 'request was made for a feed that does not exist';
    errorCode = 2;
    res.json({ error, errorCode, data });
    return;
  }
  var data = postMgr.getPosts()[+req.params.feedid].posts;
  res.json({ error, errorCode, data });
});

export default router;
