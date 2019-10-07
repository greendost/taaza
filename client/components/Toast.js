import React from 'react';

/**
 * @module client/components/Toast
 */

/**
 * Show toast message - eg. your session is over, please login again
 * @param {string} message
 * @param {function} handleToastClickClose
 */
const Toast = ({ message = '', handleToastClickClose = () => {} }) => {
  const styleFn = theme => ({
    // borderBottom: '1px solid #ff702e',
    background: theme.color.warnBg,
    color: theme.color.warn,
    padding: `10px ${theme.container.padding}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '& .closeButton': {
      cursor: 'pointer'
    }
  });

  return !message ? null : (
    <p css={theme => [styleFn(theme)]}>
      <span>{message}</span>
      <span className="closeButton" onClick={handleToastClickClose}>
        close
      </span>
    </p>
  );
};

export default Toast;
