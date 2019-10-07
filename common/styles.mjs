const themeList = {
  dark: {
    primary: '#000E66',
    primaryAdjust10: '#001599',
    primary2: '#453954',
    primary2Adjust10: '#2C2436',
    secondary: '#f0e5c5',
    secondaryGlow: '#FAF7EE',
    secondaryGlowLight: 'rgba(250, 247, 238, 0.4)',
    secondary2: '#d9e043',
    secondary2Desat20Adj10: '#D3D680',
    warn: '#000E66'
  },
  light: {
    primary: '#f0e5c5',
    primaryAdjust10: '#E6D39C',
    primary2: '#d9e043',
    primary2Adjust10: '#C6CE22',
    secondary: '#000E66',
    secondaryGlow: '#001FE6',
    secondaryGlowLight: 'rgba(0, 31, 230, 0.2)',
    secondary2: '#453954',
    secondary2Desat20Adj10: '#2D2D2D',
    warn: '#000E66'
  },
  email: {
    primary: '#f0e5c5',
    primaryAdjust10: '#E6D39C',
    primary2: '#d9e043',
    primary2Adjust10: '#C6CE22',
    secondary: '#000E66',
    secondaryGlow: '#001FE6',
    secondaryGlowLight: 'rgba(0, 31, 230, 0.2)',
    secondary2: '#453954',
    warn: '#000E66'
  }
};

/**
 * @module common/styles
 * @description Set the theme, defined as an object entry in themeList
 * Used client side and in emails
 * @param {string} mode e.g. light, dark, email (which is light for now)
 * @return {object} theme object
 */
const setTheme = mode => {
  var tm = themeList[mode];
  return {
    color: {
      backgroundColor: tm.primary,
      color: tm.secondary,
      colorGlow: tm.secondaryGlow,
      colorGlowLight: tm.secondaryGlowLight,
      // list
      listBg: tm.primary2,
      listBgHover: tm.primary2Adjust10,
      listBorder: tm.primary2Adjust10,
      list: tm.secondary2,
      // menu
      menuItemBg: tm.primary,
      menuItemBgHover: tm.primaryAdjust10,
      menuItem: tm.secondary,
      // button
      buttonBg: tm.primary,
      buttonBgHover: tm.primaryAdjust10,
      button: tm.secondary,
      buttonGlow: tm.secondaryGlow,
      // link
      link1: tm.secondary,
      link2: tm.secondary2Desat20Adj10,
      // warn
      warnBg: '#ffb129',
      warn: tm.warn
    },
    typography: {
      fontSize: '100%',
      fontSizeSelect: '1.1rem',
      fontFamily: 'Arial, Helvetica, serif'
    },
    container: {
      padding: '25px'
    },
    border: `1px solid ${tm.secondary}`
  };
};

export default setTheme;
