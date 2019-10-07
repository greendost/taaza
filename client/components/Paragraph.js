import React from 'react';

const myStyleFn = theme => ({
    lineHeight: '1.3rem',
    marginBottom: '10px'
})

const Paragraph = ({children, style,...props}) => {
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

export default Paragraph;