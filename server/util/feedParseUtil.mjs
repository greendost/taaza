var regexHttp = /https?:\/\/[^'"><)\s]+/g;

/**
 * @module server/util/parseFeed
 * @description Parse raw xml feed data, either 'rss' format or
 * Atom ('feed')
 * @param {object} jsonFeedData
 * @param {string} baseUrl
 * @param {object} options
 * @return feed metadata object and parsed posts Array
 */
export function parseFeed(jsonFeedData, baseUrl, options = {}) {
  var feedId = options.feed.id || 0;
  var feedName = options.feed.name || 'feed';

  var items = [],
    type = '',
    dateField = '',
    meta = {}; // feed metadata extracted from json data
  if (jsonFeedData.rss) {
    var keys = Object.keys(jsonFeedData.rss.channel[0]);
    keys = keys.filter(k => k !== 'item');
    keys.forEach(k => {
      meta[k] = jsonFeedData.rss.channel[0][k];
    });
    meta['_type'] = type = 'rss';
    items = jsonFeedData.rss.channel[0].item;
    // type = 'rss';
    dateField = 'pubDate';
  } else if (jsonFeedData.feed) {
    var keys = Object.keys(jsonFeedData.feed);
    keys = keys.filter(k => k !== 'item');
    keys.forEach(k => {
      meta[k] = jsonFeedData.feed[k];
    });
    meta['_type'] = type = 'atom';
    items = jsonFeedData.feed.entry;
    // type = 'atom';
    dateField = 'updated';
  } else {
    console.log(
      'feedUrl retrieved, xmlparsed, but no rss or feed field: ',
      feedName
    );
    return [meta, items];
  }

  // parse through meta part of json feed data

  var posts = items.map(item => {
    var title = `Post from ${feedName}`;
    var url = 'No link provided';
    var pubDate = new Date();
    var extraUrls = [];

    // get feed title
    if (type === 'rss') {
      if (item.title) title = item.title[0];
    } else if (type === 'atom') {
      if (item.title && Array.isArray(item.title) && item.title.length) {
        if (typeof item.title[0] === 'string') {
          title = item.title[0];
        } else if (typeof item.title[0] === 'object' && item.title[0]['_']) {
          title = item.title[0]['_'];
        }
      }
    }

    // get feed links
    if (type === 'rss') {
      // if we have an original link for feedburner feeds, use that,
      // otherwise use the standard link
      if (item['feedburner:origLink'] || item.link) {
        url = item.link[0];
      }
    } else if (type === 'atom') {
      if (item['link'] && Array.isArray(item['link'])) {
        for (let i = 0; i < item['link'].length; i++) {
          let linkX = item['link'][i];
          if (
            linkX['$'] &&
            linkX['$']['rel'] &&
            linkX['$']['rel'] === 'alternate' &&
            linkX['$']['href']
          ) {
            url = linkX['$']['href'];
          }
        }
      }
    }

    // get datefield
    if (item[dateField]) {
      var dt = new Date(item[dateField]);
      pubDate = isNaN(dt) ? pubDate : dt;
    }

    // parse description for extra urls
    if (item['description']) {
      var result = null;
      var str = Array.isArray(item['description'])
        ? item['description'][0]
        : item['description'];

      let circuitBreaker = 0;
      while ((result = regexHttp.exec(str))) {
        let extraUrl = result[0];

        // rules to decide whether to include url
        if (extraUrl !== url && extraUrl !== baseUrl) {
          extraUrls.push(extraUrl);
        }

        ++circuitBreaker;
        if (circuitBreaker > 10) break;
      }
    }

    return {
      feed_id: feedId,
      title,
      url,
      extra_urls: extraUrls,
      pub_date: pubDate
    };
  });

  // filter out dups
  var postsTU = posts.reduce(
    (acc, curr) => acc.add(`${curr.title}|${curr.url}`),
    new Set()
  );

  if (postsTU.size !== posts.length) {
    console.log(`duplicates for ${feedId}, posts.length=${posts.length}`);
  }
  var uniquePosts = posts.filter(p => {
    var key = `${p.title}|${p.url}`;
    if (postsTU.has(key)) {
      postsTU.delete(key);
      return true;
    }
    return false;
  });

  if (postsTU.size !== 0) {
    console.log(
      `problem removing duplicates, postsTU.size=${postsTU.size} uniquePosts.length=${uniquePosts.length}`
    );
  }

  return [meta, uniquePosts];
}
