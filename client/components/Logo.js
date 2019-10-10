import React from 'react';

const myStyleFn = theme => ({
  '.cls-1': {
    fill: 'none',
    stroke: theme.color.color,
    strokeWidth: '6px',
    strokeMiterLimit: 10
  },
  display: 'inline-block',
  height: '1.2rem'
});

const Logo = () => {
  return (
    <svg viewBox="0 0 373.5 119" css={theme => [myStyleFn(theme)]}>
      <title>taazalogov1</title>
      <polyline className="cls-1" points="0 3 119 3 59 23 59 119" />
      <rect className="cls-1" x="155" y="59" width="52" height="57" />
      <line className="cls-1" x1="228.5" y1="116" x2="207" y2="116" />
      <rect className="cls-1" x="300" y="59" width="52" height="57" />
      <line className="cls-1" x1="373.5" y1="116" x2="352" y2="116" />
      <line className="cls-1" x1="181" y1="87" x2="207" y2="59" />
      <rect className="cls-1" x="81" y="59" width="52" height="57" />
      <line className="cls-1" x1="154.5" y1="116" x2="133" y2="116" />
      <line className="cls-1" x1="81" y1="73" x2="133" y2="59" />
      <line className="cls-1" x1="293" x2="293" y2="26" />
      <path
        className="cls-1"
        d="M241.5,74.5h48s7.5,6.5,0,14c0,0-48,9-48,31v12h54"
        transform="translate(-12.5 -15.5)"
      />
      <line className="cls-1" x1="59" y1="3" x2="59" y2="23" />
    </svg>
  );
};

export default Logo;
