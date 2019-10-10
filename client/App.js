import React, { useReducer, useEffect } from 'react';
import { BrowserRouter, Switch, Route, Link } from 'react-router-dom';
import { hot } from 'react-hot-loader/root';
import { ThemeProvider } from 'emotion-theming';
import { Global } from '@emotion/core';

import AppPage from './pages/AppPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PWResetPage from './pages/PWResetPage';
import PWResetRequestPage from './pages/PWResetRequestPage';
import AboutPage from './pages/AboutPage';
import SettingsPage from './pages/SettingsPage';
import AppContext from './context/AppContext';
import mainReducer from './reducer/MainReducer';
import setTheme from '../common/styles';
import Header from './components/Header';
import statusEnum from './models/enums';

// Global initial state for useReducer
// Unusual issue, possible bug in webpack imports  - if importing
// initial state from another module, a reference error results
// so keeping initial state here for now.
var initialState = {
  userState: 'default', // i.e. default, loggedin, loggedout
  userFeeds: [],
  feeds: [],
  postsForSelectedFeedId: [],
  // network status
  userFeedsStatus: statusEnum.NOT_LOADED,
  feedsStatus: statusEnum.NOT_LOADED,
  postsForSelectedFeedIdStatus: statusEnum.NOT_LOADED,
  selectedFeedId: null,
  version: 0.1,
  timestamp: new Date(),
  settings: { themeMode: 'light' }
};

// persist global state in local storage - if we have it, set initial state to it
try {
  let stateFromStorage = localStorage.getItem('state');
  if (stateFromStorage) {
    stateFromStorage = JSON.parse(stateFromStorage);
    if (
      stateFromStorage.version &&
      stateFromStorage.version === initialState.version
    ) {
      // consider adding validation, or date check
      initialState = stateFromStorage;
    } else {
      localStorage.removeItem('state');
    }
  }
} catch (err) {
  console.log('error:', err);
}

/**
 * @description Renders out application
 * @module client/App
 *
 */
const App = () => {
  useEffect(() => {
    // always update csrf token for any page that send post requests
    fetch('/csrftoken')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          document
            .querySelector('meta[name="csrf-token"]')
            .setAttribute('content', data.data);
        }
      })
      .catch(err => {
        console.log('error: ', err);
      });
  }, []);
  const [state, dispatch] = useReducer(mainReducer, initialState);

  var theme = setTheme(state.settings.themeMode);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <ThemeProvider theme={theme}>
        <Global
          styles={{
            '*': { margin: 0, padding: 0, boxSizing: 'border-box' },
            body: {
              minHeight: '100vh',
              backgroundColor: theme.color.backgroundColor,
              color: theme.color.color,
              height: '100%',
              fontSize: theme.typography.fontSize,
              fontFamily: theme.typography.fontFamily,
              paddingTop: '3rem' // compensate for fixed header
            },
            '#root': { height: '100%', minHeight: '100vh' },
            a: {
              color: theme.color.link1
            }
          }}
        ></Global>
        <BrowserRouter>
          <Header />
          <Switch>
            <Route exact path="/login" component={LoginPage} />
            <Route
              exact
              path="/pwresetrequest"
              component={PWResetRequestPage}
            />
            <Route exact path="/pwresetverify" component={PWResetPage} />
            <Route exact path="/signup" component={SignupPage} />
            <Route exact path="/about" component={AboutPage} />
            <Route exact path="/settings" component={SettingsPage} />
            <Route path="/" component={AppPage} />
          </Switch>
        </BrowserRouter>
      </ThemeProvider>
    </AppContext.Provider>
  );
};

export default hot(App);
