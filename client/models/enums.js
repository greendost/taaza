/**
 * @module client/models/enums
 */

/**
 * @enum {number}
 * @description Status in regards to network request.
 * <br />Basic idea: resource_NRSE_action<br />
 * NRSE - refers to status codes below, and action could be
 * things like subscribe, unsubscribe, get all (currently default), etc.
 */
var statusEnum = {
  /** an initial state for a resource */
  NOT_LOADED: 0,
  /** request has been sent */
  REQUEST: 1,
  /** acknowledgement received from server that request
   * was successfully processed
   */
  SUCCESS: 2,
  /** acknowledgement received from server -  error
   * occurred while processing request
   */
  ERROR: 3
};

export default statusEnum;
