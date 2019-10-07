import React from 'react';
import Main from '../components/Main';
import H1 from '../components/H1';
import Paragraph from '../components/Paragraph';

const AboutPage = () => {
  return (
    <Main
      style={theme => ({ paddingTop: '20px', maxWidth: '600px', width: '80%' })}
    >
      <H1>About</H1>
      <div>
        <Paragraph>
          Welcome to Taaza, a web-based RSS Reader. Currently in an alpha stage,
          this app offers a variety of publicly available RSS feeds that one can
          subscribe to. This app does not support adding personal feeds, but if
          there is a feed that you are looking for, please feel free to suggest
          one.
        </Paragraph>
        <Paragraph>
          Technical description - this app is built with React (hooks and
          useReducer + useContext) on the front-end, and Node with Express on
          the back end. So Javascript all the way!
        </Paragraph>
      </div>
    </Main>
  );
};

export default AboutPage;
