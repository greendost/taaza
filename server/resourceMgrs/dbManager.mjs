import mariadb from 'mariadb';
import logger from './logger.mjs';

/**
 * @module server/resourceMgrs/dbManager
 */

var pool;
var isReady = false;
var dbMgr = {
  /**
   * @function setupPool
   * @description Setup MariaDB pool
   */
  setupPool: async () => {
    try {
      pool = await mariadb.createPool({
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      });
      isReady = true;
    } catch (err) {
      logger.error(`dbManager error:  ${err}`);
    }
  },
  /**
   * @function getConn
   * @description Get connection from the database pool.
   * This should be used in try..catch..finally control flow, where
   * it should be released in the finally block e.g. conn.release()
   */
  getConn: async () => {
    var conn;
    try {
      conn = await pool.getConnection();
    } catch (err) {
      logger.error(`dbManager error:  ${err}`);
    }
    return conn;
  },
  dbIsReady: () => isReady
};

export default dbMgr;
