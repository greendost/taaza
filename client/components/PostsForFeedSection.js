import React, { useContext } from 'react';
import AppContext from '../context/AppContext';
import BigListElement from './BigListElement';
import GridRow from './GridRow';

/**
 * @module client/components/PostsForFeedSection
 * @description Show RSS posts from a given feed
 */
const PostsForFeedSection = () => {
  const { state, dispatch } = useContext(AppContext);

  const bigListStyle = theme => ({
    borderBottom: `1px solid ${theme.color.listBorder}`,
    padding: `20px ${theme.container.padding}`,
    '.listItemTitle': {
      fontSize: '18px'
    },
    a: {
      fontSize: '0.8rem',
      color: theme.color.link2
    }
  });

  const listStyle = theme => ({
    padding: '10px 0',
    '&:nth-of-type(1)': {
      paddingTop: '0'
    }
  });

  return (
    <div>
      {state.selectedFeedId === null ? (
        <p css={theme => [{ padding: `10px ${theme.container.padding}` }]}>
          No feed selected
        </p>
      ) : !state.postsForSelectedFeedId.length ? (
        <p css={theme => [{ padding: `10px ${theme.container.padding}` }]}>
          No posts available for this feed
        </p>
      ) : (
        <ul style={{ listStyleType: 'none' }}>
          {state.postsForSelectedFeedId.map((post, i) => {
            return (
              <BigListElement key={i} style={bigListStyle}>
                <p className="listItemTitle">{post.title}</p>
                <GridRow>
                  <a href={post.url} style={{ overflow: 'hidden' }}>
                    {post.url}
                  </a>
                  <a
                    href={post.url}
                    style={{ paddingLeft: '10px' }}
                    target="_blank"
                  >
                    new tab
                  </a>
                  <br />
                </GridRow>
                {!post.extraUrls.length ? null : (
                  <>
                    <p>Additional urls</p>
                    <ul style={{ listStyleType: 'none' }}>
                      {post.extraUrls.map((url, i) => (
                        <li key={i} css={theme => [listStyle(theme)]}>
                          <GridRow>
                            <a href={url} style={{ overflow: 'hidden' }}>
                              {url}
                            </a>
                            <a
                              href={url}
                              style={{ paddingLeft: '10px' }}
                              target="_blank"
                            >
                              new tab
                            </a>
                          </GridRow>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <div>
                  <span>{new Date(post.pubDate).toLocaleString()}</span>
                  <br />
                </div>
              </BigListElement>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default PostsForFeedSection;
