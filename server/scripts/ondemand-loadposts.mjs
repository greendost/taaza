#!/usr/bin/env node --experimental-modules

import mariadb from 'mariadb';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import xml2js from 'xml2js';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import { loggerScript } from '../resourceMgrs/logger.mjs';
import { epochSeconds, toSQLDateTime } from '../util/util.mjs';
import { parseFeed } from '../util/feedParseUtil.mjs';

/**
 * @module server/scripts/ondemand-loadposts
 */

// hack to create __dirname that is not available by default in mjs file
// https://stackoverflow.com/questions/46745014/alternative-for-dirname-in-node-when-using-the-experimental-modules-flag
const __dirname = dirname(fileURLToPath(import.meta.url));
const logger = loggerScript;

const result = dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});
if (result.error) {
  logger.error('problem reading .env file');
  throw result.error;
}

var parser = new xml2js.Parser();

logger.info('loadposts - fetching feeds...', new Date());

// globals
// var regexHttp = /https?:\/\/[^'"><)\s]+/g;
var regexBaseUrl = /.*\/\/(?:(?!\?)(?!\/).)*/;

/**
 * @function anonymous_IIFE
 * @description Steps
 * <ul>
 * <li>connect to database</li>
 * <li>fetch feed</li>
 * <li>parse feed</li>
 * </ul>
 */
(async function() {
  try {
    var conn = await mariadb.createConnection({
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    var feeds = await conn.query(`SELECT * FROM feeds`);
    await processFeeds(conn, feeds);
    await conn.end();
  } catch (err) {
    logger.error('error2: ', err);
  }
})();

/**
 * @description Iterate through feeds, determine whether to fetch from
 * network or pass. If fetching, then have resulting xml feed parsed into
 * JSON posts
 * @param {Object} conn
 * @param {Array} feeds
 */
async function processFeeds(conn, feeds) {
  // for (let feedIndex = 14; feedIndex < 19; feedIndex++) {
  for (let feedIndex = 0; feedIndex < feeds.length; feedIndex++) {
    let feed = feeds[feedIndex];
    let feedUrl = feed.url;
    let feedId = feed.id;

    logger.debug(`feedId=${feedId} feed=${feed.name}`);
    let baseUrl = regexBaseUrl.exec(feedUrl)[0];
    if (
      feed.last_fetched.getTime() / 1000 + feed.refresh_interval_seconds >
      epochSeconds()
    ) {
      // logger.debug('\tnot fetching: ', feeds[feedIndex].name);
      continue;
    }

    try {
      var updateFeedFields = [];
      var options = {};
      if (feed.check_new) {
        if (feed.check_new & 1 && feed.upstream_etag) {
          options.header = {
            'if-none-match': feed.upstream_etag
          };
        } else if (feed.check_new & 2 && feed.upstream_last_modified) {
          options.header = {
            'if-modified-since': feed.upstream_last_modified
          };
        }
      }
      var res = await fetch(feedUrl, options);

      if (res.status === 200) {
        if (feed.check_new & 1 && res.headers.has('etag')) {
          let etag = res.headers.get('etag');
          updateFeedFields.push({ upstream_etag: etag });
        }
        if (feed.check_new & 2 && res.headers.has('last-modified')) {
          let last_modified = res.headers.get('last-modified');
          updateFeedFields.push({
            upstream_last_modified: last_modified
          });
        }
        var xmldata = await res.text();
        var jsonFeedData = await parser.parseStringPromise(xmldata);

        var [feedMetaData, fetchedPosts] = parseFeed(jsonFeedData, baseUrl, {
          feed: feeds[feedIndex]
        });

        // Bring all current posts for a feed, which goes back 'n' days.
        // This means "new" posts that went out and now are back in would
        // be ignored.  This might be revisited ...
        var inDBPosts = await conn.query(
          'SELECT * from posts where feed_id=?',
          feedId
        );
        var [oldPosts, newPosts] = diffPosts(inDBPosts, fetchedPosts);
        logger.debug(
          `${newPosts.length} new posts for ${feeds[feedIndex].name}`
        );
        var newPostsArray = newPosts.map(post => [
          post.feed_id,
          post.title,
          post.url,
          post.extra_urls,
          post.pub_date
        ]);

        var oldPostsIds = oldPosts
          .filter(post => post.status !== 0)
          .map(post => [post.id]);
        logger.debug(
          `${oldPostsIds.length} old posts for ${feeds[feedIndex].name}`
        );

        if (newPostsArray.length) {
          await conn.batch(
            'INSERT INTO posts (feed_id,title,url,extra_urls,pub_date) VALUES (?,?,?,?,?)',
            newPostsArray
          );
        }
        if (oldPostsIds.length) {
          await conn.batch('UPDATE posts SET status=0 WHERE id=?', oldPostsIds);
        }
      } else if (res.status != 304) {
        // unexpected response
        logger.error(`unexpected status: ${res.status}`);
        continue;
      }

      // update feed, setting last_refreshed, and if present, etag and
      // last-modified fields from upstream feed as well
      updateFeedFields.push({ last_fetched: toSQLDateTime(0) });
      let fieldsStr = updateFeedFields
        .map(uff => `${Object.keys(uff)[0]}=?`)
        .join(',');
      let updateQuery = `UPDATE feeds SET ${fieldsStr} WHERE id=?`;
      let updateArray = updateFeedFields.map(uff => Object.values(uff)[0]);
      updateArray.push(feedId);
      await conn.query(updateQuery, updateArray);
    } catch (err) {
      logger.error(`error1: ${err}`);
    }
  } // end for
}

/**
 * @description Compute new posts, and old posts that should be archived
 * @param {Array} inDBPosts should be unique per title,url
 * @param {Array} fetchedPosts should be unique per title,url
 * @return Array of [old posts, new posts]
 */
function diffPosts(inDBPosts, fetchedPosts) {
  const post2key = post => `${post.title}|${post.url}`;
  var inDBPostsTU = inDBPosts.reduce(
    (acc, curr) => acc.add(post2key(curr)),
    new Set()
  );
  var fetchedPostsTU = fetchedPosts.reduce(
    (acc, curr) => acc.add(post2key(curr)),
    new Set()
  );

  // keep the new posts
  var newPosts = fetchedPosts.filter(post => !inDBPostsTU.has(post2key(post)));
  // find the old posts as well
  var oldPosts = inDBPosts.filter(post => !fetchedPostsTU.has(post2key(post)));

  return [oldPosts, newPosts];
}
