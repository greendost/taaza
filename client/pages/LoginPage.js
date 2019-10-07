import React, { useState, useContext } from 'react';
import { Redirect, Link } from 'react-router-dom';
import AppContext from '../context/AppContext';
import queryString from 'query-string';
import Main from '../components/Main';
import {
  inputStyleFn,
  formStyleFn,
  mainStyleFn,
  groupedInputsFn,
  statusStyleFn,
  errorStyleFn
} from '../styles/authStyles';
import Button from '../components/Button';

/**
 * @module client/pages/LoginPage
 */

/**
 * Login page - gateway into the app.  Note that whole app is an SPA, so
 * authentication handled accordingly
 * @param {Object} props
 */
const LoginPage = props => {
  var [username, setUsername] = useState('');
  var [password, setPassword] = useState('');
  var [errorMsg, setErrorMsg] = useState('');

  const { state, dispatch } = useContext(AppContext);

  // set status message, if any received from server or redirect.
  // I am not too thrilled about mixing logic for status code and messages from
  // react router, but this will have to do for now.
  var { status } = queryString.parse(props.location.search, {
    parseNumbers: true
  });
  var statusMsg = '';
  if (status === 1)
    statusMsg =
      'Great, you are now signed up!  Now, one last step - please login.';
  else if (props.location.state && props.location.state.message) {
    statusMsg = props.location.state.message;
  }

  const handleSubmit = ev => {
    ev.preventDefault();

    // fetch csrf token first
    fetch('/csrftoken')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          document
            .querySelector('meta[name="csrf-token"]')
            .setAttribute('content', data.data);
          fetch('/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'CSRF-Token': document
                .querySelector('meta[name="csrf-token"]')
                .getAttribute('content')
            },
            body: JSON.stringify({ username, password })
          })
            .then(res => res.json())
            .then(data => {
              // on successful login
              if (!data.error) {
                dispatch([
                  { type: 'USER_STATE_UPDATE', payload: 'loggedin' },
                  { type: 'USER_FEEDS_LOCAL_UPDATE', payload: [] },
                  { type: 'GLOBAL_FEEDS_LOCAL_UPDATE', payload: [] },
                  { type: 'SELECTED_FEED_ID_LOCAL_UPDATE', payload: null },
                  {
                    type: 'POSTS_FOR_SELECTED_FEED_ID_LOCAL_UPDATE',
                    payload: []
                  }
                ]);
              } else {
                setErrorMsg(data.error);
              }
            })
            .catch(err => {
              console.log('error: ', err);
            });
        }
      })
      .catch(err => {
        console.log('error: ', err);
      });
  };

  const handleUsernameChange = ev => {
    setUsername(ev.target.value);
  };
  const handlePasswordChange = ev => {
    setPassword(ev.target.value);
  };

  return state.userState === 'loggedin' ? (
    <Redirect to="/" />
  ) : (
    <Main style={mainStyleFn}>
      {statusMsg ? (
        <p css={theme => [statusStyleFn(theme)]}>{statusMsg}</p>
      ) : null}
      <form onSubmit={handleSubmit} css={theme => [formStyleFn(theme)]}>
        {errorMsg ? <p css={theme => errorStyleFn(theme)}>{errorMsg}</p> : null}
        <div
          css={theme => {
            [groupedInputsFn(theme)];
          }}
        >
          <p>
            <label htmlFor="username">Email</label>
            <br />
            <input
              name="username"
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Email"
              css={theme => [inputStyleFn(theme)]}
              required
            />
          </p>
          <p>
            <label htmlFor="password">Password</label>
            <br />
            <input
              name="password"
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Password"
              css={theme => [inputStyleFn(theme)]}
              required
            />
          </p>
        </div>
        <Button type="submit">Login</Button>
      </form>
      <Link to="/pwresetrequest">I forgot my password</Link>
    </Main>
  );
};

export default LoginPage;
