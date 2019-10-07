import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';

import AppContext from '../context/AppContext';
import UserTopFeeds from './UserTopFeeds';
import Button from './Button';
import SmallListElement from './SmallListElement';
import PTitle from './PTitle';
import CircleXButton from './CircleXButton';
import GlowableSpan from './GlowableSpan';

/**
 * @module client/components/UserFeedsSection
 */

/**
 * Section where user manages the feeds - including
 * setting top feeds, unsubscribing, or just accessing feeds
 * beyond the top 'n'.  Probably the most complex part of the front-end.
 * @param {function} setToastMessage set the toast message
 */
const UserFeedsSection = ({ setToastMessage }) => {
  const [showAllFeeds, setShowAllFeeds] = useState(false);
  const [isSelectToDelete, setIsSelectToDelete] = useState(false);
  const [isSelectToSetTopFeed, setIsSelectToSetTopFeed] = useState(false);
  const [feedBeingEditedForTopFeed, setFeedBeingEditedForTopFeed] = useState(
    null
  );

  const { state, dispatch } = useContext(AppContext);
  useEffect(() => {
    if (state.userState === 'loggedin' && !state.userFeeds.length) {
      fetch('/api/userfeeds')
        .then(res => res.json())
        .then(data => {
          if (data.error && data.errorCode === 1) {
            if (state.userState === 'loggedin') {
              dispatch({ type: 'USER_STATE_CHANGE', payload: 'loggedout' });
            }
          } else {
            dispatch({ type: 'USER_FEEDS_SUCCESS', payload: data.data });
          }
        })
        .catch(err => {
          console.log('error: ', err);
        });
    } else if (state.userState === 'loggedout') {
      setToastMessage(
        <>
          Your session has ended. Please <Link to="/login">login</Link> again
        </>
      );
    }
  }, [state.userState]);

  /**
   * @function computeTopFeeds
   * @param {Array} userFeeds
   * @param {number} maxNumTopFeeds
   * @description Compute topFeeds from userFeeds, handling cases where
   * a subset or no feeds are marked as top or favorite feeds
   */
  const computeTopFeeds = (userFeeds, maxNumTopFeeds) => {
    var topFeedsNumericIndices = [];

    let positionsNotCovered = Array.from({ length: maxNumTopFeeds }).map(
      (_, i) => i + 1
    );

    for (let i = 0; i < userFeeds.length; i++) {
      if (userFeeds[i].favoriteIndex > 0) {
        topFeedsNumericIndices[userFeeds[i].favoriteIndex - 1] = i;
        positionsNotCovered = positionsNotCovered.filter(
          idx => idx !== userFeeds[i].favoriteIndex
        );
      }
    }

    if (positionsNotCovered.length) {
      for (let i = 0; i < userFeeds.length; i++) {
        if (!userFeeds[i].favoriteIndex || userFeeds[i].favoriteIndex === 0) {
          topFeedsNumericIndices[positionsNotCovered[0] - 1] = i;
          if (!(positionsNotCovered = positionsNotCovered.slice(1)).length)
            break;
        }
      }
    }
    return topFeedsNumericIndices;
  };

  const handleClickFeed = ev => {
    var feedid = +ev.currentTarget.dataset.feedid;
    if (state.userState === 'loggedout') {
      setToastMessage(
        <>
          Your session has ended. Please <Link to="/login">login</Link> again
        </>
      );
      return;
    }

    if (isSelectToSetTopFeed) {
      setFeedBeingEditedForTopFeed(feedid);
    } else {
      var url =
        state.userState === 'default'
          ? `/guestapi/posts/${feedid}`
          : state.userState === 'loggedin'
          ? `/api/posts/${feedid}`
          : null;
      if (url) {
        fetch(url)
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              if (data.errorCode === 1) {
                dispatch({ type: 'USER_STATE_UPDATE', payload: 'loggedout' });
              }
            } else {
              dispatch({
                type: 'POSTS_FOR_SELECTED_FEED_ID_SUCCESS',
                payload: data.data
              });
            }
          })
          .catch(err => {
            console.log('error: ', err);
            dispatch({
              type: 'POSTS_FOR_SELECTED_FEED_ID_ERROR',
              payload: null
            });
          });

        dispatch([
          { type: 'SELECTED_FEED_ID_LOCAL_UPDATE', payload: feedid },
          {
            type: 'POSTS_FOR_SELECTED_FEED_ID_REQUEST',
            payload: []
          }
        ]);
      }
    }
  };

  const toggleAllFeeds = _ => {
    if (showAllFeeds) {
      // clean up if we are in the process of unsubscribing or setting top feeds
      if (isSelectToDelete) {
        setIsSelectToDelete(false);
      }
      if (isSelectToSetTopFeed) {
        setFeedBeingEditedForTopFeed(null);
        setIsSelectToSetTopFeed(false);
      }
    }
    setShowAllFeeds(!showAllFeeds);
  };
  const toggleUnsubscribe = _ => {
    if (!feedBeingEditedForTopFeed) {
      setIsSelectToDelete(!isSelectToDelete);
      setIsSelectToSetTopFeed(false);
    }
  };
  const toggleSetTopFeed = _ => {
    setFeedBeingEditedForTopFeed(null);
    setIsSelectToSetTopFeed(!isSelectToSetTopFeed);
    setIsSelectToDelete(false);
  };
  const cancelEditTopFeed = ev => {
    setFeedBeingEditedForTopFeed(null);
    ev.stopPropagation();
  };
  const handleSetTopFeed = ev => {
    var newIndex = +ev.target.dataset.value;
    var feedid = +ev.target.parentNode.dataset.feedid;

    if (state.userState === 'loggedout') {
      setToastMessage(
        <>
          Your session has ended. Please <Link to="/login">login</Link> again
        </>
      );
      return;
    } else {
      if (state.userState === 'loggedin') {
        fetch('/api/userfeeds', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': document
              .querySelector('meta[name="csrf-token"]')
              .getAttribute('content')
          },
          body: JSON.stringify({
            feedid: feedid,
            favoriteIndex: newIndex
          })
        })
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              if (data.errorCode === 1) {
                dispatch({ type: 'USER_STATE_UPDATE', payload: 'loggedout' });
              }
            }
            setFeedBeingEditedForTopFeed(null);
            dispatch({
              type: 'USER_FEEDS_LOCAL_UPDATE_FAVORITE_INDEX',
              payload: {
                feedId: feedid,
                favoriteIndex: newIndex
              }
            });
          })
          .catch(err => {
            console.log('error: ', err);
          });
      } else {
        // default
        setFeedBeingEditedForTopFeed(null);
        dispatch({
          type: 'USER_FEEDS_LOCAL_UPDATE_FAVORITE_INDEX',
          payload: {
            feedId: feedid,
            favoriteIndex: newIndex
          }
        });
      }
      ev.stopPropagation();
    }
  };

  const handleUnsubscribe = ev => {
    var feedid = +ev.currentTarget.parentNode.dataset.feedid;

    if (state.userState === 'loggedout') {
      setToastMessage(
        <>
          Your session has ended. Please <Link to="/login">login</Link> again
        </>
      );
      return;
    } else if (state.userState === 'loggedin') {
      fetch(`/api/userfeeds/${feedid}`, {
        method: 'DELETE',
        headers: {
          'CSRF-Token': document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute('content')
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.error && data.errorCode === 1) {
            dispatch({ type: 'USER_STATE_UPDATE', payload: 'loggedout' });
            return;
          }
          dispatch({ type: 'USER_FEEDS_SUCCESS_UNSUBSCRIBE', payload: feedid });
        })
        .catch(err => {
          console.log('error: ', err);
        });
    } else {
      // default
      dispatch({ type: 'USER_FEEDS_LOCAL_UNSUBSCRIBE', payload: feedid });
    }

    ev.stopPropagation();
  };

  // compute topFeeds
  var maxNumTopFeeds = 3;
  var topFeedsNumericIndices = computeTopFeeds(state.userFeeds, maxNumTopFeeds);

  // render
  return (
    <div css={theme => [{ padding: `20px ${theme.container.padding}` }]}>
      {!state.userFeeds.length ? (
        <p>No feeds loaded</p>
      ) : (
        <>
          <UserTopFeeds
            toggleAllFeeds={toggleAllFeeds}
            handleClickFeed={handleClickFeed}
            showAllFeeds={showAllFeeds}
            userFeeds={state.userFeeds}
            topFeedsNumericIndices={topFeedsNumericIndices}
            selectedFeedId={state.selectedFeedId}
          />
          {!showAllFeeds ? null : (
            <div css={theme => [{ paddingTop: '20px' }]}>
              <PTitle>All feeds</PTitle>
              <div style={{ marginBottom: '10px' }}>
                <Button
                  onClick={toggleUnsubscribe}
                  className={isSelectToDelete ? 'activeGlow' : ''}
                  style={theme => ({ marginRight: '20px' })}
                >
                  Unsubscribe
                </Button>
                <Button
                  onClick={toggleSetTopFeed}
                  className={isSelectToSetTopFeed ? 'activeGlow' : ''}
                >
                  Set Top Feeds
                </Button>
              </div>
              <ul style={{ listStyleType: 'none' }}>
                {state.userFeeds.map((f, i) => (
                  <SmallListElement
                    key={i}
                    data-feedid={f.feedId}
                    onClick={handleClickFeed}
                    style={theme => ({ position: 'relative' })}
                  >
                    <div
                      style={{ display: 'inline-block', marginRight: '10px' }}
                    >
                      <GlowableSpan
                        className={
                          f.feedId === state.selectedFeedId ? 'activeGlow' : ''
                        }
                      >
                        {f.name}
                      </GlowableSpan>
                      {!state.userFeeds[i].favoriteIndex ? null : (
                        <span> {state.userFeeds[i].favoriteIndex} </span>
                      )}
                    </div>
                    {!isSelectToDelete ? null : (
                      <span
                        onClick={handleUnsubscribe}
                        style={{
                          display: 'inline-block',
                          position: 'absolute',
                          top: 0,
                          width: '1.6rem',
                          height: '1.6rem'
                        }}
                      >
                        <CircleXButton />
                      </span>
                    )}
                    {feedBeingEditedForTopFeed !== f.feedId ? null : (
                      <div
                        data-feedid={f.feedId}
                        css={theme => [
                          {
                            border: theme.border,
                            width: '250px',
                            height: '50px',
                            position: 'relative'
                          }
                        ]}
                      >
                        <Button
                          onClick={handleSetTopFeed}
                          data-value={1}
                          style={theme => ({
                            border: 'none',
                            borderRight: theme.border,
                            height: '100%',
                            display: 'inline-block',
                            padding: 0,
                            width: '50px'
                          })}
                        >
                          1
                        </Button>
                        <Button
                          onClick={handleSetTopFeed}
                          data-value={2}
                          style={theme => ({
                            border: 'none',
                            borderRight: theme.border,
                            height: '100%',
                            display: 'inline-block',
                            padding: 0,
                            width: '50px'
                          })}
                        >
                          2
                        </Button>
                        <Button
                          onClick={handleSetTopFeed}
                          data-value={3}
                          style={theme => ({
                            border: 'none',
                            borderRight: theme.border,
                            height: '100%',
                            display: 'inline-block',
                            padding: 0,
                            width: '50px'
                          })}
                        >
                          3
                        </Button>
                        <span
                          onClick={cancelEditTopFeed}
                          css={theme => [
                            {
                              display: 'inline-block',
                              position: 'absolute',
                              right: 0,
                              top: 0,
                              width: '1.6rem',
                              height: '1.6rem'
                            }
                          ]}
                        >
                          <CircleXButton />
                        </span>
                      </div>
                    )}
                  </SmallListElement>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserFeedsSection;
