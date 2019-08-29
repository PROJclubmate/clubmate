const express  = require('express'),
  router       = express.Router({mergeParams: true}),
  middleware   = require('../middleware'),
  {upload}     = require('../public/js/cloudinary.js'),
  {discussionsNew, discussionsPagination, discussionsVote} = require('../controllers/discussions');


//	================================	/posts/:post_id/discussions  ====================================

// Create a new subPost in discussion
router.post('/clubs/:club_id/posts/:post_id/discussions', upload.array('images', 10),
middleware.isLoggedIn, discussionsNew);

// Navigate pages(AJAX)
router.get('/clubs/:club_id/posts/:post_id/m-sP', middleware.isLoggedIn, discussionsPagination);

// Vote subPosts(AJAX)
router.put('/subposts/:bucket_id/:subpost_id/vote', middleware.isLoggedIn, discussionsVote);

module.exports = router;