import React, { useContext } from 'react';
import Main from '../components/Main';
import H1 from '../components/H1';
import AppContext from '../context/AppContext';

/**
 * @module client/pages/SettingsPage
 */

/**
 * @description default style function for settings page
 * @param {Object} theme
 */
const styleFn = theme => ({
  '.inputItem:nth-of-type(1)': {
    marginBottom: '10px'
  },
  'input[type="radio"]': {
    marginRight: '10px'
  },
  p: {
    marginBottom: '5px'
  }
});

/**
 * @description Settings page.  Currently just light/dark theme, but other
 * settings would be added here
 */
const SettingsPage = () => {
  const { state, dispatch } = useContext(AppContext);
  const handleThemeChange = ev => {
    dispatch({ type: 'THEME_LOCAL_UPDATE', payload: ev.target.value });
  };

  return (
    <Main
      style={theme => ({ paddingTop: '20px', maxWidth: '600px', width: '80%' })}
    >
      <H1>Settings</H1>
      <div css={theme => [styleFn(theme)]}>
        <p>Theme</p>
        <div className="inputItem">
          <label>
            <input
              name="theme"
              value="light"
              type="radio"
              onChange={handleThemeChange}
              checked={state.settings.themeMode === 'light'}
            />
            <span>Light</span>
          </label>
        </div>
        <div className="inputItem">
          <label>
            <input
              name="theme"
              value="dark"
              type="radio"
              onChange={handleThemeChange}
              checked={state.settings.themeMode === 'dark'}
            />
            <span>Dark</span>
          </label>
        </div>
      </div>
    </Main>
  );
};

export default SettingsPage;
