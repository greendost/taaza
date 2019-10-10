import React from 'react';
import { Switch, Route, Link } from 'react-router-dom';

import ViewPostsSubPage from '../components/ViewPostsSubPage';
import AddFeedsSubPage from '../components/AddFeedsSubPage';
import NoMatchPage from './NoMatchPage';
import Main from '../components/Main';

/**
 * @module client/pages/AppPage
 */

/**
 * @description Default style function for panel below header
 * @param {object} theme
 */
const panelStyleFn = theme => ({
  borderBottom: theme.border,
  height: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  padding: `0 ${theme.container.padding}`
});

/**
 * @description App page
 */
const AppPage = () => {
  return (
    <>
      <div css={theme => [panelStyleFn(theme)]}>
        <Link to="/" style={{ textDecoration: 'none', paddingRight: '15px' }}>
          View Feed
        </Link>
        <Link to="/add" style={{ textDecoration: 'none' }}>
          Add Feed
        </Link>
      </div>
      <Main>
        <Switch>
          <Route exact path="/add" component={AddFeedsSubPage} />
          <Route exact path="/" component={ViewPostsSubPage} />
          <Route component={NoMatchPage} />
        </Switch>
      </Main>
    </>
  );
};

export default AppPage;
