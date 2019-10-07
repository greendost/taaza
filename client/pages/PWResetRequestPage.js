import React, { useState, useContext } from 'react';
import { Redirect } from 'react-router-dom';

import AppContext from '../context/AppContext';
import {
  inputStyleFn,
  formStyleFn,
  mainStyleFn,
  groupedInputsFn,
  messageStyleFn,
  statusStyleFn,
  errorStyleFn
} from '../styles/authStyles';
import Button from '../components/Button';
import Main from '../components/Main';
import PTitle from '../components/PTitle';
import Paragraph from '../components/Paragraph';

/**
 * @module client/pages/PWResetRequestPage
 */

// validate email function courtesy of
// https://tylermcginnis.com/validate-email-address-javascript/
function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * @enum {number}
 */
const pageViewStates = {
  /** view password request form */
  VIEW_FORM: 1,
  /** if password request successfully received on server, show success message */
  VIEW_SUCCESS_MESSAGE: 2
};

/**
 * Password Reset Request Page
 * @param {object} props
 */
const PWResetRequestPage = props => {
  var [errorMsg, setErrorMsg] = useState('');
  var [email, setEmail] = useState('');
  var [pageView, setPageView] = useState(pageViewStates.VIEW_FORM);

  const { state } = useContext(AppContext);

  var statusMsg = '';
  // if(status === 2)
  //     statusMsg = 'We ran into an unexpected problem trying to complete the password reset.  Sorry for the inconvenience, but please try again later.';
  if (props.location.state && props.location.state.message) {
    statusMsg = props.location.state.message;
  }

  const handleSubmit = ev => {
    ev.preventDefault();

    if (!isEmailValid(email)) {
      setErrorMsg('Please enter your email address');
    } else {
      // fetch csrf token
      fetch('/csrftoken')
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            document
              .querySelector('meta[name="csrf-token"]')
              .setAttribute('content', data.data);
            fetch('/pwreset/request', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': document
                  .querySelector('meta[name="csrf-token"]')
                  .getAttribute('content')
              },
              body: JSON.stringify({ email })
            })
              .then(res => res.json())
              .then(data => {
                if (!data.error) {
                  setPageView(pageViewStates.VIEW_SUCCESS_MESSAGE);
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

  const handleEmailChange = ev => {
    setEmail(ev.target.value);
  };

  if (state.userState === 'loggedin') return <Redirect to="/" />;
  else if (pageView === pageViewStates.VIEW_SUCCESS_MESSAGE) {
    return (
      <Main style={mainStyleFn}>
        <div css={theme => [messageStyleFn(theme)]}>
          <PTitle>Ok, we have received your password reset request.</PTitle>
          <Paragraph>
            Please check your email for the link to proceed further
          </Paragraph>
        </div>
      </Main>
    );
  } else {
    return state.userState === 'loggedin' ? (
      <Redirect to="/" />
    ) : (
      <Main style={mainStyleFn}>
        {statusMsg ? (
          <p css={theme => [statusStyleFn(theme)]}>{statusMsg}</p>
        ) : null}
        <form onSubmit={handleSubmit} css={theme => [formStyleFn(theme)]}>
          {errorMsg ? (
            <p css={theme => errorStyleFn(theme)}>{errorMsg}</p>
          ) : null}
          <div css={theme => [groupedInputsFn(theme)]}>
            <p>
              <label htmlFor="email">Email</label>
              <br />
              <input
                name="email"
                id="email"
                type="text"
                value={email}
                onChange={handleEmailChange}
                css={theme => [inputStyleFn(theme)]}
                required
              />
            </p>
          </div>
          <Button type="submit">Reset password</Button>
        </form>
      </Main>
    );
  }
};

export default PWResetRequestPage;
