import React, { useEffect, useState, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import AppContext from '../context/AppContext';
import PTitle from './PTitle';
import Paragraph from './Paragraph';
import statusEnum from '../models/enums';

const styleCardContainerFn = theme => ({
  height: '250px',
  padding: '1rem',
  width: '100%',
  '@media screen and (min-width: 600px)': {
    width: '33.3%'
  },
  '@media screen and (min-width: 960px)': {
    width: '25%'
  }
});

const styleCardFn = theme => ({
  backgroundColor: theme.color.cardBg,
  color: theme.color.list,
  height: '100%',
  boxShadow: `1px 1px 3px ${theme.color.cardShadow}`,
  padding: '10px',
  overflow: 'hidden',
  position: 'relative',
  cursor: 'pointer',
  '&.noSelect': {
    cursor: 'auto',
    backgroundColor: theme.color.cardBgNoSelect
  }
});

/**
 * @module client/components/AddFeedsSubPage
 * @description Container page for selecting and adding feeds
 */
const AddFeedsSubPage = () => {
  const { state, dispatch } = useContext(AppContext);
  var userFeedsObj = {};
  state.userFeeds.forEach(uf => {
    userFeedsObj[uf.feedId] = uf;
  });

  useEffect(() => {
    // console.log('AddFeedsSubPage - useEffect');
    if (!state.feeds.length) {
      if (state.userState === 'default') {
        fetch('/guestapi/feeds')
          .then(res => res.json())
          .then(data => {
            dispatch({ type: 'GLOBAL_FEEDS_SUCCESS', payload: data.data });
          })
          .catch(err => {
            console.log('error: ', err);
          });
      } else if (state.userState === 'loggedin') {
        fetch('/api/feeds')
          .then(res => res.json())
          .then(data => {
            if (data.error && data.errorCode === 1) {
              dispatch({ type: 'USER_STATE_UPDATE', payload: 'loggedout' });
            } else {
              dispatch({ type: 'GLOBAL_FEEDS_SUCCESS', payload: data.data });
            }
          })
          .catch(err => {
            console.log('error: ', err);
          });
      }
    }
    if (!state.userFeeds.length) {
      if (state.userState === 'loggedin') {
        fetch('/api/userfeeds')
          .then(res => res.json())
          .then(data => {
            if (data.error && data.errorCode === 1) {
              dispatch({ type: 'USER_STATE_UPDATE', payload: 'loggedout' });
            } else {
              dispatch({ type: 'USER_FEEDS_SUCCESS', payload: data.data });
            }
          })
          .catch(err => {
            console.log('error: ', err);
          });
      }
    }
  }, []);

  const handleChecked = ev => {
    // update db
    var feedid = +ev.currentTarget.dataset.feedid;
    if (
      (state.userState === 'loggedin' && !userFeedsObj[feedid]) ||
      (userFeedsObj[feedid] &&
        userFeedsObj[feedid].statusSubscribe === statusEnum.ERROR)
    ) {
      fetch('/api/userfeeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute('content')
        },
        body: JSON.stringify({ data: feedid })
      })
        .then(res => res.json())
        .then(data => {
          if (data.error && data.errorCode === 1) {
            dispatch({ type: 'USER_STATE_UPDATE', payload: 'loggedout' });
            return;
          }
          dispatch({ type: 'USER_FEEDS_SUCCESS_SUBSCRIBE', payload: feedid });
        })
        .catch(err => {
          console.log('error: ', err);
          dispatch({ type: 'USER_FEEDS_ERROR_SUBSCRIBE', payload: feedid });
        });

      dispatch({ type: 'USER_FEEDS_REQUEST_SUBSCRIBE', payload: feedid });
    } else if (state.userState === 'default') {
      dispatch({ type: 'USER_FEEDS_LOCAL_SUBSCRIBE', payload: feedid });
    }
  };

  // render, conditionally
  switch (state.userState) {
    case 'default':
    case 'loggedin':
      return (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            marginTop: '25px',
            padding: '0 30px'
          }}
        >
          {state.feeds.map((f, i) => (
            <div key={i} css={theme => [styleCardContainerFn(theme)]}>
              <div
                css={theme => [styleCardFn(theme)]}
                onClick={handleChecked}
                data-feedid={f.feedId}
                className={
                  userFeedsObj[f.feedId] &&
                  (userFeedsObj[f.feedId].statusSubscribe ===
                    statusEnum.SUCCESS ||
                    userFeedsObj[f.feedId].statusSubscribe ===
                      statusEnum.REQUEST)
                    ? 'noSelect'
                    : ''
                }
              >
                <PTitle
                  style={theme => ({ display: 'flex', alignItems: 'center' })}
                >
                  <img
                    src={`/feedicons/${f.faviconFile}`}
                    style={{
                      maxWidth: '1rem',
                      maxHeight: '1rem',
                      marginRight: '0.5rem'
                    }}
                  />
                  {f.name}
                </PTitle>
                <Paragraph>{f.description}</Paragraph>
                {!userFeedsObj[f.feedId] ? null : (
                  <p
                    style={{
                      fontSize: '0.9rem',
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      fontStyle: 'italic'
                    }}
                  >
                    {userFeedsObj[f.feedId].statusSubscribe ===
                    statusEnum.SUCCESS
                      ? 'subscribed'
                      : userFeedsObj[f.feedId].statusSubscribe ===
                        statusEnum.REQUEST
                      ? 'subscribing ...'
                      : userFeedsObj[f.feedId].statusSubscribe ===
                        statusEnum.ERROR
                      ? 'problem subscribing!'
                      : 'not sure'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    case 'loggedout':
      return (
        <p css={theme => [{ padding: `10px ${theme.container.padding}` }]}>
          Please <Link to="/login">login</Link>
        </p>
      );
  }
};

export default AddFeedsSubPage;
