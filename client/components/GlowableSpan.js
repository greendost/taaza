import React from 'react';

/**
 * @module client/components/GlowableSpan
 */

const styleFn = theme => ({
  '&.activeGlow': {
    color: theme.color.colorGlow,
    textShadow: `1px 1px 3px ${theme.color.colorGlowLight}`
    // fontSize: theme.typography.fontSizeSelect
  },
  transition: `all 0.2s ease-in`
});

/**
 * @description Allow for span to glow when className='activeGlow', otherwise
 * className should be set to '' (empty quotes)
 * @param {JSX} children
 * @param {object} props
 * @return {JSX} Glowable span JSX
 */
const GlowableSpan = ({ children, ...props }) => {
  return (
    <span css={theme => [styleFn(theme)]} {...props}>
      {children}
    </span>
  );
};

export default GlowableSpan;
