import React, { useState, useContext } from 'react';
import { Redirect } from 'react-router-dom';
import AppContext from '../context/AppContext';
import queryString from 'query-string';
import {
  inputStyleFn,
  formStyleFn,
  mainStyleFn,
  groupedInputsFn,
  errorStyleFn
} from '../styles/authStyles';
import Button from '../components/Button';
import Main from '../components/Main';
import PTitle from '../components/PTitle';

/**
 * @module client/pages/PWResetPage
 */

/**
 * Set password policy.  Note: this should probably be moved to util
 * @param {string} pw
 */
function passwordPolicy(pw) {
  if (pw.length < 10) return false;
  return true;
}

/**
 * Password Reset page
 * @param {Object} props
 */

const PWResetPage = props => {
  var [errorMsg, setErrorMsg] = useState('');
  var [password1, setPassword1] = useState('');
  var [password2, setPassword2] = useState('');
  var [redirectData, setRedirectData] = useState(null);

  const { state } = useContext(AppContext);

  const handleSubmit = ev => {
    ev.preventDefault();

    if (password1 !== password2) {
      setErrorMsg('Your passwords do not match.  Please re-enter');
    } else if (!passwordPolicy(password1)) {
      setErrorMsg('Your password should be at least 10 characters long');
    } else {
      var { email, token } = queryString.parse(props.location.search);

      // fetch csrf token first
      fetch('/csrftoken')
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            document
              .querySelector('meta[name="csrf-token"]')
              .setAttribute('content', data.data);
            fetch('/pwreset/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': document
                  .querySelector('meta[name="csrf-token"]')
                  .getAttribute('content')
              },
              body: JSON.stringify({ password1, password2, email, token })
            })
              .then(res => res.json())
              .then(data => {
                if (!data.error) {
                  setRedirectData({
                    redirect: data.data.redirect,
                    message: data.data.message
                  });
                } else {
                  // error
                  if (data.data.redirect) {
                    setRedirectData({
                      redirect: data.data.redirect,
                      message: data.error
                    });
                  } else {
                    setErrorMsg(data.error);
                  }
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
  const handlePasswordChange = ev => {
    if (ev.target.name === 'password1') setPassword1(ev.target.value);
    else if (ev.target.name === 'password2') setPassword2(ev.target.value);
  };

  // render
  if (state.userState === 'loggedin') {
    return <Redirect to="/" />;
  } else if (redirectData) {
    return (
      <Redirect
        to={{
          pathname: redirectData.redirect,
          state: { message: redirectData.message }
        }}
      />
    );
  } else {
    return (
      <Main style={mainStyleFn}>
        <PTitle style={theme => ({ marginBottom: '20px' })}>
          Please enter a new password
        </PTitle>
        <form onSubmit={handleSubmit} css={theme => [formStyleFn(theme)]}>
          {errorMsg ? (
            <p css={theme => errorStyleFn(theme)}>{errorMsg}</p>
          ) : null}
          <div css={theme => [groupedInputsFn(theme)]}>
            <p>
              <label htmlFor="password1">Password</label>
              <br />
              <input
                name="password1"
                id="password1"
                type="password"
                value={password1}
                onChange={handlePasswordChange}
                placeholder="Password"
                css={theme => [inputStyleFn(theme)]}
                required
              />
            </p>
            <p>
              <label htmlFor="password2">Confirm password</label>
              <br />
              <input
                name="password2"
                id="password2"
                type="password"
                value={password2}
                onChange={handlePasswordChange}
                placeholder="Confirm password"
                css={theme => [inputStyleFn(theme)]}
                required
              />
            </p>
          </div>
          <Button type="submit">Set new password</Button>
        </form>
      </Main>
    );
  }
};

export default PWResetPage;
