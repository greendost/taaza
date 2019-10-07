import React from 'react';

/**
 * @module client/components/SmallListElement
 */

const myStyle = theme => ({
  padding: '5px'
});

/**
 * Essentially a styled li, but contrast from
 * [BigListElement]{@link module:client/components/BigListElement}
 * @param {function} style
 * @param {JSX} children
 * @param {object} props
 */

const SmallListElement = ({ style, children, ...props }) => {
  if (!style) style = () => {};
  return (
    <li css={theme => [myStyle(theme), style(theme)]} {...props}>
      {children}
    </li>
  );
};

export default SmallListElement;
