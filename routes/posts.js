const express   = require('express'),
  router        = express.Router(),
  middleware    = require('../middleware'),
  {postsHome, postsHomeMorePosts, postsFriends_posts, postsFriends_postsMorePosts,postsDiscoverSettings, 
  postsViewSettings, postsDiscover, postsDiscoverMorePosts, postsCreate, postsView, subPostQuote, 
  postsUpdate, postsDelete, postsVote, postsModVote} = require('../controllers/posts');

if(process.env.ENVIRONMENT === 'dev'){
  var {upload} = require('../config/cloudinary.js');
} else if (process.env.ENVIRONMENT === 'prod'){
  var {upload} = require('../config/s3.js');
}


// Home page
router.get('/home', postsHome);

// Home load more posts(AJAX)
router.get('/home-morePosts', postsHomeMorePosts);

// Friends' posts page
router.get('/friends_posts', postsFriends_posts);

// Friends' posts load more posts(AJAX)
router.get('/friends_posts-morePosts', postsFriends_postsMorePosts);

// Index posts view settings
router.put('/indexposts/settings/user/:id', middleware.isLoggedIn, postsViewSettings);

// Discover page
router.get('/discover', postsDiscover);

// Discover settings
router.put('/discover/settings/user/:id', middleware.isLoggedIn, postsDiscoverSettings);

// Discover load more posts(AJAX)
router.get('/discover-morePosts', postsDiscoverMorePosts);

// Create new post
router.post('/clubs/:club_id/posts', middleware.isLoggedIn, upload.single('image'), postsCreate);

// View post
router.get('/clubs/:club_id/posts/:post_id', postsView);

// Quote a subPost
router.get('/clubs/:club_id/posts/:post_id/subPost/:bucket_id', middleware.isLoggedIn, subPostQuote);

// Update post
router.put('/clubs/:club_id/posts/:post_id', middleware.isLoggedIn, postsUpdate);

// Delete post
router.delete('/clubs/:club_id/posts/:post_id', middleware.isLoggedIn, postsDelete);

// Vote (AJAX)
router.put('/posts/:post_id/vote', middleware.isLoggedIn, postsVote);

// ModVote (AJAX)
router.put('/posts/:post_id/modvote', middleware.isLoggedIn, postsModVote);

module.exports = router;