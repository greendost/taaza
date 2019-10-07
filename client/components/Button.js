import React from 'react';

/**
 * @module client/components/Button
 */

/**
 * @description Default Emotion-based style function for the button
 * @param {object} theme Emotion theme object
 */
const styleFn = theme => ({
  padding: '10px',
  backgroundColor: theme.color.buttonBg,
  color: theme.color.button,
  '&:hover': { backgroundColor: theme.color.buttonBgHover },
  border: theme.border,
  '&.activeGlow': {
    boxShadow: `0 0 2px 2px ${theme.color.buttonGlow} inset`
  },
  fontSize: '0.9rem'
});

/**
 * @description Button React component
 * @param {JSX} children
 * @param {function} style Emotion style function to override default style
 * @param {object} props
 * @return {JSX} button
 */
const Button = ({ children, style, ...props }) => {
  if (!style) style = () => {};
  return (
    <button css={theme => [styleFn(theme), style(theme)]} {...props}>
      {children}
    </button>
  );
};

export default Button;
