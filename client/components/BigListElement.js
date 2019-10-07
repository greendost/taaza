import React from 'react';

/**
 * @module client/components/BigListElement
 */

const myStyle = theme => ({
  padding: '10px',
  backgroundColor: theme.color.listBg,
  color: theme.color.list,
  ':hover': {
    backgroundColor: theme.color.listBgHover
  }
});

/**
 * A styled li, but bigger style, used more like a container list element
 * @param {function} style
 * @param {JSX} children
 * @param {object} props
 */
const BigListElement = ({ style, children, ...props }) => {
  return (
    <li css={theme => [myStyle(theme), style(theme)]} {...props}>
      {children}
    </li>
  );
};

export default BigListElement;
