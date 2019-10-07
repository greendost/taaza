import React from 'react';


const myStyleFn = theme => ({
    fontSize: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    paddingBottom: '1rem'
});

const H1 = ({style, children,...props}) => {
    if(!style) style = () => {};

    return (
        <h1 
            css={theme=>[myStyleFn(theme),style(theme)]}
            {...props}
        >
            {children}
        </h1>
    )
};

export default H1;