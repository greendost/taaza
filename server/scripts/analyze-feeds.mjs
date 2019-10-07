import dotenv from 'dotenv';
import fetch from 'node-fetch';
import xml2js from 'xml2js';
import path, { dirname } from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import parse from 'csv-parse/lib/sync.js';
import stringify from 'csv-stringify/lib/sync.js';
import cheerio from 'cheerio';
import url from 'url';

import { loggerScript } from '../resourceMgrs/logger.mjs';
import { parseFeed } from '../util/feedParseUtil.mjs';

const logger = loggerScript;

// hack to create __dirname that is not available by default in mjs file
// https://stackoverflow.com/questions/46745014/alternative-for-dirname-in-node-when-using-the-experimental-modules-flag
const __dirname = dirname(fileURLToPath(import.meta.url));

const result = dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});
if (result.error) {
  logger.error('problem reading .env file');
  throw result.error;
}

var parser = new xml2js.Parser();
const faviconDirectory = path.resolve(__dirname, '../../dist/public/feedicons');

logger.info('loadposts - fetching feeds...', new Date());

// globals
var regexBaseUrl = /.*\/\/(?:(?!\?)(?!\/).)*/;

/**
 * @module server/scripts/analyze-feeds
 */

/**
 * @function anonymous_IIFE
 * @description Steps:
 * <ul>
 * <li>(1) pull set of feeds from master feeds file</li>
 * <li>(2) fetch feeds</li>
 * <li>(3) parse feeds</li>
 * </ul>
 */
(async function() {
  try {
    var feedsStr = fs.readFileSync(
      path.resolve(__dirname, '../db/master-feed-orig-0.txt'),
      'utf8'
    );
    var feeds = parse(feedsStr, {
      delimiter: '|',
      columns: ['name', 'description', 'url', 'altBaseUrl']
    });

    var feedsPlus = await processFeeds(feeds);
    var updatedFeedsStr = stringify(feedsPlus, {
      delimiter: '|',
      columns: [
        'name',
        'description',
        'url',
        'status',
        'refresh_interval_seconds',
        'favicon_file',
        'check_new'
      ]
    });
    fs.writeFileSync(
      path.resolve(__dirname, '../db/master-feed-updated-1.txt'),
      updatedFeedsStr
    );
  } catch (err) {
    logger.error('error2: ', err);
  }
})();

/**
 * @description Iterate through feeds, determine whether to fetch from network or pass,
 * if fetching, then have resulting xml feed parsed into JSON posts, augmented with
 * additional data on favicon, refresh interval in seconds, and whether we can
 * check for new posts via etag / last modified
 * @param {Array} feeds
 * @return augmented JSON array of feeds
 */
async function processFeeds(feeds) {
  var updatedFeeds = [];

  // for (let feedIndex = 14; feedIndex < 17; feedIndex++) {
  for (let feedIndex = 0; feedIndex < feeds.length; feedIndex++) {
    let feed = feeds[feedIndex];
    let feedUrl = feed.url;
    logger.info(`feed=${feed.name}`);
    let baseUrl = feed.altBaseUrl
      ? feed.altBaseUrl
      : regexBaseUrl.exec(feedUrl)[0];

    // new fields
    var status = 5; // 0 - uninitialized, 1 active, 11 very active, 2 inactive, 5 error
    var refresh_interval_seconds = 24 * 60 * 60; // 1 day in seconds
    var favicon_file = 'default.png';
    var check_new = 0; // 0 - always get, no pre-check, 1 etag, 2 last modified

    try {
      var res = await fetch(feedUrl);
      var headers = res.headers;
      var xmldata = await res.text();
      var jsonFeedData = await parser.parseStringPromise(xmldata);

      // return meta - title, description, image-url
      var [feedMetaData, fetchedPosts] = parseFeed(jsonFeedData, baseUrl, {
        feed
      });

      // compute status and refresh_interval_seconds
      [status, refresh_interval_seconds] = computeStats(fetchedPosts);

      // get favicon
      favicon_file = await getFavicon(feedIndex, feedMetaData, baseUrl);

      // compute check_new
      if (headers.has('etag')) {
        check_new |= 1;
      }
      if (headers.has('last-modified')) {
        check_new |= 2;
      }

      logger.info(
        'feed ',
        feed.name,
        ' check_new=',
        check_new,
        ' favicon_file=',
        favicon_file,
        ' status=',
        status,
        ' refresh_interval_seconds=',
        refresh_interval_seconds
      );
    } catch (err) {
      status = 5;
      logger.error(`error1: ${err}`);
    }
    updatedFeeds.push(
      Object.assign({}, feed, {
        status,
        refresh_interval_seconds,
        favicon_file,
        check_new
      })
    );
  }
  return updatedFeeds;
}

function computeStats(fetchedPosts) {
  var status = 1,
    refresh_interval_seconds = 7 * 24 * 3600;
  var datetimes = fetchedPosts.map(post => new Date(post.pub_date).getTime());
  datetimes = datetimes.sort((a, b) => b - a);
  var mostRecentDate = new Date(datetimes[0]);
  var threeYearsBackDate = new Date();
  threeYearsBackDate.setFullYear(threeYearsBackDate.getFullYear() - 3);
  var oneYearBackDate = new Date();
  oneYearBackDate.setFullYear(oneYearBackDate.getFullYear() - 1);

  if (mostRecentDate.getTime() < threeYearsBackDate.getTime()) {
    status = 2;
    refresh_interval_seconds = 7 * 24 * 3600; // weekly refresh
  } else if (mostRecentDate.getTime() < oneYearBackDate.getTime()) {
    status = 1;
    refresh_interval_seconds = 2 * 24 * 3600; // 2 day refresh
  } else {
    status = 1;
    refresh_interval_seconds = 6 * 3600; // 6 hours
    var mostFurthestDate = new Date(datetimes[datetimes.length - 1]);

    // check density
    var numDays = (mostRecentDate - mostFurthestDate) / (1000 * 60 * 60 * 24);
    var density = datetimes.length / numDays; // 20 minutes
    if (density > 1) {
      status = 11;
      refresh_interval_seconds = 20 * 60;
    }
  }

  return [status, refresh_interval_seconds];
}

async function getFavicon(feedNum, feedMetaData, baseUrl) {
  // find url
  var faviconFile = 'default.png';
  var faviconUrl = null;
  var extension = null;
  var validExtensions = ['gif', 'ico', 'png', 'jpg'];
  var excludeBaseUrls = ['feedburner', 'blogspot'];
  var isBaseUrlExcluded = excludeBaseUrls.reduce(
    (acc, cv) => acc || baseUrl.includes(cv),
    false
  );

  const parseLink = link => {
    var extension = null;
    var faviconUrl = null;

    extension = link.split('.');
    extension = extension[extension.length - 1];
    if (extension.includes('?')) extension = extension.split('?')[0];
    if (validExtensions.includes(extension)) {
      if (link.startsWith('http')) {
        faviconUrl = link;
      } else {
        faviconUrl = url.resolve(baseUrl, link);
      }
    }
    return [extension, faviconUrl];
  };

  // first check if we have a favicon reference in the file itself
  if (
    feedMetaData.image &&
    Array.isArray(feedMetaData.image) &&
    feedMetaData.image.length &&
    feedMetaData.image[0]['url'] &&
    Array.isArray(feedMetaData.image[0]['url']) &&
    feedMetaData.image[0]['url'].length &&
    typeof feedMetaData.image[0]['url'][0] === 'string'
  ) {
    extension = feedMetaData.image[0]['url'][0].split('.');
    extension = extension[extension.length - 1];
    if (validExtensions.includes(extension)) {
      faviconUrl = feedMetaData.image[0]['url'][0];
    }
  }

  // next, search through baseUrl html to see if there is any favicon
  if (!faviconUrl) {
    if (!isBaseUrlExcluded) {
      try {
        var res = await fetch(baseUrl);
        var data = await res.text();
        var cheer$ = cheerio.load(data);
        var link;
        if (
          (link = cheer$('head link[rel="shortcut icon"]')).length &&
          link[0].attribs &&
          link[0].attribs.href
        ) {
          [extension, faviconUrl] = parseLink(link[0].attribs.href);
        } else if (
          (link = cheer$('head link[rel="icon"]')).length &&
          link[0].attribs &&
          link[0].attribs.href
        ) {
          [extension, faviconUrl] = parseLink(link[0].attribs.href);
        }
      } catch (err) {
        logger.error('error:', err);
      }
    }
  }
  // if we still don't find it, let's just check for baseUrl/favicon.ico
  // maybe we'll get lucky.
  if (!faviconUrl) {
    if (!isBaseUrlExcluded) {
      try {
        var urlPath = url.resolve(baseUrl, 'favicon.ico');
        var res = await fetch(urlPath, { method: 'HEAD' });
        if (res.status === 200) {
          faviconUrl = urlPath;
          extension = 'ico';
        }
      } catch (err) {
        logger.warn(`warning: did not find anything at ${urlPath}`);
      }
    }
  }

  if (faviconUrl) {
    // fetch and save image file
    try {
      var res = await fetch(faviconUrl);
      var data = await res.buffer();
      if (data.length === 0)
        throw new Error('zero length favicon, use default');
      faviconFile = `favicon${feedNum}.${extension}`;
      logger.debug(`favicon path=${path.join(faviconDirectory, faviconFile)}`);
      fs.writeFileSync(path.join(faviconDirectory, faviconFile), data);
    } catch (err) {
      faviconFile = 'default.png';
      logger.error('error:', err);
    }
  }

  return faviconFile;
}
