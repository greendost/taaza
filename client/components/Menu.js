import React from 'react';

const menuStyleFn = theme => ({
    'height': '3rem',
    cursor: 'pointer',
    'ul': {
        position: 'absolute',
        top: '3rem',
        right: 0,
        height: 0,
        overflow: 'hidden',
        zIndex: 100,
        listStyleType: 'none',
        cursor: 'pointer',
        borderLeft: theme.border
    },
    'li': {
        backgroundColor: theme.color.menuItemBg,
        '&:hover': { backgroundColor: theme.color.menuItemBgHover },
        color: theme.color.menuItem,
        padding: `10px 40px 10px 10px`,
        borderBottom: theme.border
    },
    'li a': {
        textDecoration: 'none',
        color: theme.color.menuItem
    },
    'label': {
        display: 'block',
        userSelect:'none',
        height: '100%',
        lineHeight: '3rem',
        verticalAlign: 'middle',
        cursor: 'pointer'
    },
    '#headerMenu': {
        display: 'none'
    },
    '#headerMenu:checked ~ ul': {
        height: 'auto'
    }
});


const Menu = ({children}) => {

    return (
        <div css={theme => [menuStyleFn(theme)]}>
            <input type="checkbox" id="headerMenu"/>
            <label htmlFor="headerMenu">Menu</label>
            <ul>
                {children}
            </ul>                
        </div>
    )
};

export default Menu;