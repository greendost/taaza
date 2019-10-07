import React from 'react';

const styleFn= theme => ({
    width: '100%', 
    maxWidth: '960px', 
    margin: '0 auto'
});

const Main = ({children, style,...props}) => {
    if(!style) style = ()=>{};

    return (
        <main css={theme=>[styleFn(theme),style(theme)]} {...props}>{children}</main>
    );
};

export default Main;