var fs = require('fs');
var path = require('path');
var mariadb = require('mariadb');
var dotenv = require('dotenv');

/**
 * @module server/scripts/setup
 */

const result = dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});
if (result.error) {
  logger.error('problem reading .env file');
  throw result.error;
}

var guestFeeds = [
  'Hacker News',
  'Swissmiss',
  'Engadget',
  'CodePen Blog',
  'Overreacted',
  'The Go Programming Language Blog'
];

/**
 * @description Setup script - currently just one task, which is to
 * export guest feeds from database into a guestfeeds.json file,
 * used in guest mode
 * @function anonymous_IIFE
 */
(async function() {
  try {
    var conn = await mariadb.createConnection({
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    var data = await conn.query(
      'SELECT id,name,description,url,favicon_file AS faviconFile FROM feeds'
    );
    var guestFeedData = data.filter(
      feedItem => guestFeeds.indexOf(feedItem.name) !== -1
    );
    var outFile = path.resolve(__dirname, '../data/guestfeeds.json');
    fs.writeFileSync(outFile, JSON.stringify(guestFeedData));
    console.log('updated ', outFile);

    await conn.end();
  } catch (err) {
    console.log('error:', err);
  }
})();
