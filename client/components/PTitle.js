import React from 'react';

const myStyleFn = theme => ({
    marginBottom: '10px'
})

const PTitle = ({children, style,...props}) => {
    if(!style) style = () => {}
    return (
        <p 
            css={theme=>[myStyleFn(theme), style(theme)]}
            {...props}
        >
            {children}
        </p>
    )
};

export default PTitle;