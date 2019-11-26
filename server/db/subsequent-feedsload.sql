-- add new feeds only script
USE taaza;
DROP TABLE IF EXISTS temp_feeds;
CREATE TABLE temp_feeds (
  name VARCHAR(100) CHARACTER SET 'utf8mb4' NOT NULL,
  description VARCHAR(255) CHARACTER SET 'utf8mb4' NOT NULL DEFAULT "Rss Feed",
  url VARCHAR(255) NOT NULL,
  refresh_interval_seconds INTEGER NOT NULL DEFAULT 1200,
  status TINYINT NOT NULL DEFAULT 0,
  favicon_file VARCHAR(255) NOT NULL DEFAULT 'default.png',
  check_new TINYINT NOT NULL DEFAULT 0
);
-- 'IGNORE' used here.  Alternative is 'REPLACE'
LOAD DATA LOCAL INFILE 'master-feed-updated-1.txt' IGNORE INTO TABLE temp_feeds CHARACTER SET UTF8MB4 FIELDS TERMINATED BY '|' (
  name,
  description,
  url,
  status,
  refresh_interval_seconds,
  favicon_file,
  check_new
);
-- now add new feeds to feeds, relying on name only at the moment
insert into
  feeds (
    name,
    description,
    url,
    refresh_interval_seconds,
    status,
    favicon_file,
    check_new
  )
select
  name,
  description,
  url,
  refresh_interval_seconds,
  status,
  favicon_file,
  check_new
from
  temp_feeds
where
  name not in (
    select
      name
    from
      feeds
  );
-- now drop the temp table
  DROP TABLE temp_feeds;