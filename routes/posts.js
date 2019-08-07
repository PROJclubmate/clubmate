const express  = require('express'),
  router       = express.Router(),
  middleware   = require('../middleware'),
  {upload}     = require('../public/js/cloudinary.js'),
  {postsHome, postsHomeMorePosts, postsFriends_posts, postsFriends_postsMorePosts, postsDiscover,
  postsDiscoverMorePosts, postsCreate, postsShow, postsQuote, postsUpdate, postsDelete, postsVote,
	postsModVote} = require('../controllers/posts');


// Home
router.get('/home', postsHome);

// Home load more posts(AJAX)
router.get('/home-morePosts', postsHomeMorePosts);

// Friends' posts
router.get('/friends_posts', postsFriends_posts);

// Friends' posts load more posts(AJAX)
router.get('/friends_posts-morePosts', postsFriends_postsMorePosts);

// Discover
router.get('/discover', postsDiscover);

// Discover load more posts(AJAX)
router.get('/discover-morePosts', postsDiscoverMorePosts);

// Create new post
router.post('/clubs/:club_id/posts', middleware.isLoggedIn, upload.single('image'), postsCreate);

// Show a post
router.get('/clubs/:club_id/posts/:post_id', postsShow);

// Quote a subPost
router.get('/clubs/:club_id/posts/:post_id/subPost/:bucket_id', middleware.isLoggedIn, postsQuote);

// Update post
router.put('/clubs/:club_id/posts/:post_id', middleware.checkPostOwnership, postsUpdate);

// Delete post
router.delete('/clubs/:club_id/posts/:post_id', middleware.checkPostOwnership, postsDelete);

// Vote (AJAX)
router.put('/posts/:post_id/vote', middleware.isLoggedIn, postsVote);

// ModVote (AJAX)
router.put('/posts/:post_id/modvote', middleware.isLoggedIn, postsModVote);

module.exports = router;