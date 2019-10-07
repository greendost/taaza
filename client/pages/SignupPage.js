import React, { useState, useContext } from 'react';
import { Redirect } from 'react-router-dom';
import AppContext from '../context/AppContext';
import queryString from 'query-string';
import {
  inputStyleFn,
  formStyleFn,
  mainStyleFn,
  messageStyleFn,
  groupedInputsFn,
  statusStyleFn,
  errorStyleFn
} from '../styles/authStyles';
import Button from '../components/Button';
import Main from '../components/Main';
import PTitle from '../components/PTitle';
import Paragraph from '../components/Paragraph';

/**
 * @module client/pages/SignupPage
 */

/**
 * Enforce rules on password
 * @param {string} pw should be 10 characters or more
 */
function passwordPolicy(pw) {
  if (pw.length < 10) return false;
  return true;
}

// validate email function courtesy of
// https://tylermcginnis.com/validate-email-address-javascript/
function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Signup page
 * @param {Object} props
 */
const SignupPage = props => {
  var [username, setUsername] = useState('');
  var [password, setPassword] = useState('');
  var [errorMsg, setErrorMsg] = useState('');
  var [pageView, setPageView] = useState('signupform');

  const { state } = useContext(AppContext);

  var { status } = queryString.parse(props.location.search, {
    parseNumbers: true
  });
  var statusMsg = '';
  if (status === 2 || status === 3 || status === 5)
    statusMsg =
      'We ran into a problem trying to setup your account.  Perhaps the account is already setup?  Otherwise, please try again';
  else if (status === 4)
    statusMsg = 'It looks like your registration expired.  Please try again';
  else if (status === 6)
    statusMsg = `Hi, sorry for the inconvenience, but for security reasons we 
    have to limit verification attempts.  Hopefully this is not a problem 
    on our end.  Please try again in a little while.`;

  const handleSubmit = ev => {
    ev.preventDefault();

    // validate
    if (!isEmailValid(username)) {
      setErrorMsg('Invalid email address');
    } else if (!passwordPolicy(password)) {
      setErrorMsg('Invalid password, must be at least ten characters');
    } else {
      fetch('/csrftoken')
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            document
              .querySelector('meta[name="csrf-token"]')
              .setAttribute('content', data.data);
            fetch('/signup', {
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
                // on successful submitting of user credentials for signup
                if (!data.error) {
                  setPageView('signupsuccess');
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
    }
  };

  const handleUsernameChange = ev => {
    setUsername(ev.target.value);
  };
  const handlePasswordChange = ev => {
    setPassword(ev.target.value);
  };

  if (state.userState === 'loggedin') return <Redirect to="/" />;
  else if (pageView === 'signupsuccess')
    return (
      <Main style={mainStyleFn}>
        <div css={theme => [messageStyleFn(theme)]}>
          <PTitle>Thank you, and just one more step.</PTitle>
          <Paragraph>
            Please check your email. We have received your signup details, and
            just need you to verify your account.
          </Paragraph>
        </div>
      </Main>
    );
  else
    return (
      <Main style={mainStyleFn}>
        {statusMsg ? (
          <p css={theme => [statusStyleFn(theme)]}>{statusMsg}</p>
        ) : null}
        <form onSubmit={handleSubmit} css={theme => [formStyleFn(theme)]}>
          {errorMsg ? (
            <p css={theme => errorStyleFn(theme)}>{errorMsg}</p>
          ) : null}
          <div
            css={theme => {
              [groupedInputsFn(theme)];
            }}
          >
            <p>
              <label htmlFor="username">Username or Email</label>
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
          <Button type="submit">Sign Up</Button>
        </form>
      </Main>
    );
};

export default SignupPage;
