import React, { useState } from 'react';
import Toast from './Toast';
import PostsForFeedSection from './PostsForFeedSection';
import UserFeedsSection from './UserFeedsSection';

/**
 * @module client/components/ViewPostsSubPage
 * @description Container page for viewing posts.  Consists of UserFeeds and
 * View posts sections
 * @return JSX
 */
const ViewPostsSubPage = () => {
  // state
  const [toastMessage, setToastMessage] = useState('');

  const handleToastClickClose = ev => {
    setToastMessage('');
  };

  return (
    <div>
      <Toast
        message={toastMessage}
        handleToastClickClose={handleToastClickClose}
      />
      <UserFeedsSection setToastMessage={setToastMessage} />
      <PostsForFeedSection />
    </div>
  );
};

export default ViewPostsSubPage;
