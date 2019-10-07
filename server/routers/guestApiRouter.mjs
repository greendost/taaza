import express from 'express';
import postMgr from '../resourceMgrs/postsManager.mjs';
import logger from '../resourceMgrs/logger.mjs';
import guestFeeds from '../data/guestfeeds.json';

/**
 * @module server/routers/guestApiRouter
 */

const router = express.Router();

/**
 * @description Endpoint for getting feeds approved for guest mode.
 * @function GET /feeds
 */
router.get('/feeds', (req, res) => {
  logger.info('guestapi: get feeds');
  res.json({ data: guestFeeds });
});

/**
 * @description Endpoint for getting posts for a particular feed id
 * @function GET /posts/:feedid
 */
router.get('/posts/:feedid', async (req, res) => {
  logger.info(`guestapi: get posts, req.params.feedid=${req.params.feedid}`);

  if (!guestFeeds.map(gf => gf.id).includes(+req.params.feedid)) {
    logger.warn(
      `guestapi: user attempting unauthorized access to feed ${req.params.feedid}`
    );
    res.json({
      error: 'Only certain feeds can be accessed without an account'
    });
    return;
  }

  var data = postMgr.getPosts()[+req.params.feedid].posts;
  res.json({ data });
});

export default router;
