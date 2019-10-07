import React from 'react';

const myStyle = theme => ({
    stroke: theme.color.color,
    '&:hover circle': {fill: theme.color.buttonBgHover},
});

const CircleXButton = () => {

    return (
        <svg viewBox="0 0 100 100" css={theme=>[myStyle(theme)]} >
            <circle cx={50} cy={50} r={45} fill='none' strokeWidth={6} />
            <line x1={25} y1={25} x2={75} y2={75} strokeWidth={5} />
            <line x1={75} y1={25} x2={25} y2={75} strokeWidth={5} />
        </svg>
    )
};

export default CircleXButton;