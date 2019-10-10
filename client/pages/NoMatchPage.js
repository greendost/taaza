import React from 'react';
import Main from '../components/Main';
import H1 from '../components/H1';
import Paragraph from '../components/Paragraph';

const NoMatchPage = () => {
  return (
    <Main
      style={theme => ({ paddingTop: '20px', maxWidth: '600px', width: '80%' })}
    >
      <H1>Something is not found</H1>
      <div>
        <Paragraph>
          Hopefully not a bug in Taaza. Please feel free to return back to the
          app.
        </Paragraph>
      </div>
    </Main>
  );
};

export default NoMatchPage;
