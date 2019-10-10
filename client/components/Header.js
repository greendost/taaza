import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router-dom';

import AppContext from '../context/AppContext';
import Menu from './Menu';
import Logo from './Logo';

const Header = ({ history }) => {
  const styleFn = theme => ({
    borderBottom: theme.border,
    height: '3rem',
    padding: `0 ${theme.container.padding}`,
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.color.backgroundColor,
    color: theme.color.color,
    zIndex: 10
  });

  const { state, dispatch } = useContext(AppContext);
  const handleLogout = ev => {
    fetch('/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': document
          .querySelector('meta[name="csrf-token"]')
          .getAttribute('content')
      },
      body: JSON.stringify({ data: 'loggedout' })
    })
      .then(res => res.json())
      .then(data => {})
      .catch(err => {
        console.log('error:', err);
      });
    dispatch({ type: 'USER_STATE_UPDATE', payload: 'loggedout' });
  };

  return (
    <header css={theme => [styleFn(theme)]}>
      <div>
        <Link to="/">
          <Logo />
        </Link>
      </div>
      {state.userState === 'loggedout' || state.userState === 'default' ? (
        <div>
          <ul style={{ listStyleType: 'none' }}>
            <li style={{ display: 'inline-block', paddingRight: '20px' }}>
              <Link to="/login">Login</Link>
            </li>
            <li style={{ display: 'inline-block' }}>
              <Link to="/signup">Sign Up</Link>
            </li>
          </ul>
        </div>
      ) : (
        <Menu>
          <li
            onClick={_ => {
              history.push('/settings');
              document.getElementById('headerMenu').click();
            }}
          >
            <Link to="/settings">Settings</Link>
          </li>
          <li
            onClick={_ => {
              history.push('/about');
              document.getElementById('headerMenu').click();
            }}
          >
            <Link to="/about">About</Link>
          </li>
          <li onClick={handleLogout}>Logout</li>
        </Menu>
      )}
    </header>
  );
};

export default withRouter(Header);

/*
                            <li><form style={{display: 'inline-block'}} onSubmit={handleLogout}><button type="submit">Logout</button></form></li>


                                        <div style={{height: '3rem'}}>

*/
