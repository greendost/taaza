# Taaza

RSS Feed Reader (and portfolio web app).

Subscribe to RSS feeds, and view the latest posts. Without an account, you can access the posts of a few great feeds, but signing up will provide access to the full set.

Assuming no issues with the app, you can check it out at [https://www.taaza.app/](https://www.taaza.app/)

## Getting Started

Just hop on over to [https://www.taaza.app/](https://www.taaza.app/). No account needed to access at least a small set of feeds.

### General setup

Running this locally is a bit complicated. Below is a set of steps, likely
missing one or two things. Please message me and I can try to help.

As the authentication system relies on email verification, if you don't have an AWS account, I would suggest manually adding a user into the database (e.g. perhaps an INSERT INTO users statement), and logging in with that user. It would probably be best to extract and tweak logic from the signupRouter to help with this.

Steps

- Make sure to have installed a version of node that supports the "--experimental-modules" flag to allow for ES modules (until it is supported officially). I used version 12.10,
  setup via nvm.
- Clone repository
- Install Redis and Mariadb
- Run `npm install`
- Create .env file in project root folder
  e.g.

```
NODE_ENV=development
AWS_SDK_LOAD_CONFIG=1
PORT=some_port
SESSION_DURATION_SECONDS=some_number_of_seconds
APP_EMAIL_VERIFYLINK="http://localhost:some_port/signup/verify"
APP_EMAIL_PWRESET_VERIFYLINK="http://localhost:some_port/pwresetverify"
SESSION_SECRET="your session secret"
# database
DB_HOST=localhost
DB_DATABASE=taaza
DB_USER=database_user
DB_PASSWORD=database_password
REDIS_PW=redis_password
```

- Setup database: cd into /server/db, startup mysql (make sure mariadb server
  is running, as well as Redis),
  then run
  `source init.sql`
- Next, create a database user. Script not provided, but it should be similar to the following:

```
CREATE USER database_user @localhost IDENTIFIED BY PASSWORD '_whatever_password you_pick';
GRANT ALL PRIVILEGES ON taaza._ TO database_user @localhost;
FLUSH PRIVILEGES;
```

- Create your master feeds file (master-feed-orig-0.txt). At the moment I have not included mine, but it is a 4 column pipe delimited file: name|description|url|optional_baseUrl (optional baseUrl to be used for pulling the favicon, in
  case the feed url is a feedburner one instead of the original site)
- Generate the "stage 1" feeds file from the master feeds file.

```
node --experimental-modules analyze-feeds.mjs
```

- Upload stage 1 file into feeds table - source initload.sql
  Best to have id start from 1. If needed, run below first, then initload.sql
  ALTER TABLE feeds AUTO_INCREMENT = 1;
- Run ondemand-loadposts.sh to load posts, if not already running in a cron job.
  Make sure this is also running a cron job too. Launch crontab editor (typically vi/vim), add cron schedule line (Google for syntax or use crontab.guru), and confirm afterwards with crontab -l.

```
crontab -e
```

- Run setup.js to create guestfeeds.json
- Run `npm run dev` in a dedicated terminal session to start Express server
- Open `localhost:<PORT>` in a modern browser, where port is what you specified in the .env file

## Deployment

I have this application running (as of October 2019) on an AWS instance.

## Built With

React Hooks, Emotion on the front-end, Node, Express, MariaDB and Redis
on the back-end.

## Contributing

Looking forward to any contributions, thoughts, and feedback - whether visual design, UX, accessibility, development, etc. Also, please feel free to reach out if interested in user testing.

## Versioning

Let's call it 0.1

## Authors

- **Harteg Wariyar** - _Initial work_ - [greendost](https://github.com/greendost)

## License

Please see the [LICENSE](LICENSE) file for details

## Acknowledgments

Too many to thank, but certainly this code stands on the shoulders of many -
from those writing blog posts addressing various web topics to those developing the core open source packages and applications - from Node, Express, React, MariaDB, Redis to xml2js, winston, emotion, cheerio, etc.
Thanks also to those keeping RSS feeds alive!
