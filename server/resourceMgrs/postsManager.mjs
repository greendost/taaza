import dbMgr from './dbManager.mjs';
import logger from './logger.mjs';

var fetchIntervalMs = 2 * 60 * 1000; // 2 minutes polling
var posts = {};

/**
 * @module server/resourceMgrs/postsManager
 */

/**
 * @description Tweak array of posts, and save in object mapped to key of
 * feed id.
 * @param {Array} postsFromDB
 */
const computePosts = postsFromDB => {
  var resultPosts = {};

  postsFromDB.forEach(rawPost => {
    let post = {};
    post.title = rawPost.title;
    post.url = rawPost.url;
    post.extraUrls = JSON.parse(rawPost.extra_urls);
    post.pubDate = rawPost.pub_date;
    post.status = rawPost.status;
    if (!resultPosts[rawPost.feed_id]) {
      resultPosts[rawPost.feed_id] = { posts: [post] };
    } else {
      resultPosts[rawPost.feed_id].posts.push(post);
    }
  });

  return resultPosts;
};

/**
 * @description Load posts from database into memory every fetchIntervalMs milliseconds
 * @function anonymous_IIFE
 */
const loadPosts = async () => {
  if (dbMgr.dbIsReady()) {
    try {
      var conn = await dbMgr.getConn();
      var data;
      // get the posts data
      if (!posts.meta) {
        // select all posts
        data = await conn.query(
          'SELECT id,feed_id,title,url,extra_urls,pub_date,status FROM posts WHERE status=1 ORDER BY pub_date DESC'
        );
        posts.meta = { isLoaded: true };
      } else {
        // select active posts
        data = await conn.query(
          'SELECT p.id,feed_id,title,p.url,extra_urls,pub_date,p.status FROM posts p INNER JOIN feeds f ON p.feed_id = f.id WHERE f.status IN (1,11) AND p.status=1 ORDER BY pub_date DESC'
        );
      }
      posts = Object.assign({}, posts, computePosts(data));
    } catch (err) {
      logger.error(`error: ${err}`);
    } finally {
      conn.release();
    }

    logger.info('posts loaded');
  } else {
    logger.debug('database not ready');
  }
};

var postsMgr = {
  start: () => {
    setTimeout(loadPosts, 5 * 1000);
    setInterval(loadPosts, fetchIntervalMs);
  },
  getPosts: () => {
    return posts;
  }
};

export default postsMgr;
