import React, { useState } from 'react';

import Button from './Button';
import GlowableSpan from './GlowableSpan';

/**
 * @module client/components/UserTopFeeds
 */

/**
 * @description Section where we show the top n feeds as indicated by the user,
 * defaulting to first n feeds selected by user.
 * @param {function} toggleAllFeeds
 * @param {function} handleClickFeed
 * @param {boolean} showAllFeeds
 * @param {Array} userFeeds
 * @param {Array} topFeedsNumericIndices
 * @param {number} selectedFeedId
 */
const UserTopFeeds = ({
  toggleAllFeeds,
  handleClickFeed,
  showAllFeeds,
  userFeeds,
  topFeedsNumericIndices,
  selectedFeedId
}) => {
  return (
    <div
      css={
        showAllFeeds
          ? theme => [{ borderBottom: theme.border, paddingBottom: '20px' }]
          : null
      }
    >
      <p>Your top feeds</p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div>
          {topFeedsNumericIndices.map(numIndex => {
            return (
              <div
                key={numIndex}
                style={{ display: 'inline-block', marginRight: '10px' }}
                data-feedid={userFeeds[numIndex].feedId}
                onClick={handleClickFeed}
              >
                <GlowableSpan
                  className={
                    userFeeds[numIndex].feedId === selectedFeedId
                      ? 'activeGlow'
                      : ''
                  }
                >
                  {userFeeds[numIndex].name}
                </GlowableSpan>
              </div>
            );
          })}
        </div>
        <Button
          onClick={toggleAllFeeds}
          className={showAllFeeds ? 'activeGlow' : ''}
        >
          Show all feeds
        </Button>
      </div>
    </div>
  );
};

export default UserTopFeeds;
