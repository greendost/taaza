import express from 'express';
import nunjucks from 'nunjucks';
import webpack from 'webpack';
import webpackConfig from '../webpack.dev.js';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import session from 'express-session';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import csurf from 'csurf';
import redis from 'redis';
import connectRedis from 'connect-redis';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// routers
import apiRouter from './routers/apiRouter.mjs';
import guestApiRouter from './routers/guestApiRouter.mjs';
import loginRouter from './routers/loginRouter.mjs';
import signupRouter from './routers/signupRouter.mjs';
import pwResetRouter from './routers/pwResetRouter.mjs';
import logger from './resourceMgrs/logger.mjs';
import dbMgr from './resourceMgrs/dbManager.mjs';
import postsMgr from './resourceMgrs/postsManager.mjs';

// initial config vars with defaults
dotenv.config();
const PORT = process.env.PORT || 2004;
const sessionDuration = process.env.SESSION_DURATION_SECONDS || 120;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
// starting up
const app = express();
const RedisStore = connectRedis(session);
logger.info(`IS_PRODUCTION=${IS_PRODUCTION}`);
var csrfProtection = csurf();
(async () => {
  await dbMgr.setupPool();
  postsMgr.start();
})();
// 100 requests per 15 min per IP - universal rate limit
// certain endpoints have additional limits or slowdown
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// setup view
nunjucks.configure('./server/templates/views', {
  autoescape: true,
  express: app
});

app.use(helmet());
app.use(limiter);

// setup session
var sess = {
  store: new RedisStore({
    client: redis.createClient({
      prefix: 'taazasess',
      password: process.env.REDIS_PW
    })
  }),
  cookie: {
    maxAge: sessionDuration * 1000, // maxAge in ms
    httpOnly: true
  },
  secret: process.env.SESSION_SECRET,
  name: 'feeds.app',
  rolling: true,
  saveUninitialized: false,
  resave: false
};
if (IS_PRODUCTION) {
  app.set('trust proxy', 1);
  sess.cookie.secure = true;
  sess.cookie.domain = 'taaza.app';
}

// middleware
app.use(session(sess));

app.use((req, res, next) => {
  logger.info(
    `req.url=${req.url} req.session.id=${req.session.id} req.method=${req.method}`
  );
  next();
});

// authentication check for api endpoint here, before csrf
app.use('/api', (req, res, next) => {
  logger.debug('auth check for user');
  if (!req.session.username) {
    res.json({ error: 'not logged in', errorCode: 1 });
  } else {
    logger.debug(`req.session.username=${req.session.username}`);
    next();
  }
});

app.use(csrfProtection);

app.use(bodyParser.json());
app.use(express.static('./dist/public'));

if (!IS_PRODUCTION) {
  const webpackCompiler = webpack(webpackConfig);
  app.use(webpackDevMiddleware(webpackCompiler));
  app.use(webpackHotMiddleware(webpackCompiler));
}

// application api
app.use('/api', apiRouter);
app.use('/guestapi', guestApiRouter);

// auth
app.use('/login', loginRouter);
app.use('/signup', signupRouter);
app.use('/pwreset', pwResetRouter);
app.post('/logout', (req, res) => {
  req.session.username = null;
  res.json({ data: 'loggedout' });
});

app.get('/csrftoken', (req, res) => {
  res.json({ data: req.csrfToken() });
});

// app itself
app.get('*', (req, res) => {
  res.render('index.njk');
});

app.listen(PORT, () => {
  logger.info(`listening on port ${PORT}`);
});
