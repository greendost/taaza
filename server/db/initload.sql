USE taaza;
DELETE FROM
  user_feeds;
DELETE FROM
  posts;
DELETE FROM
  feeds;
DELETE FROM
  users;
ALTER TABLE
  feeds AUTO_INCREMENT = 1;
LOAD DATA LOCAL INFILE 'master-feed-updated-1.txt' INTO TABLE feeds CHARACTER SET UTF8MB4 FIELDS TERMINATED BY '|' (
    name,
    description,
    url,
    status,
    refresh_interval_seconds,
    favicon_file,
    check_new
  );