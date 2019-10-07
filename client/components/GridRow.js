import React from 'react';


const GridRow = ({children}) => {

    const styleFn = theme => ({
        display: 'grid',
        gridTemplateRows: 'auto',
        gridTemplateColumns: 'minmax(0,1fr) 100px'
    })

    return (
        <div css={theme => [styleFn(theme)]}>
            {children}
        </div>
    )
};

export default GridRow;