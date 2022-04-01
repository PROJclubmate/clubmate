const express = require('express'),
  router      = express.Router({mergeParams: true}),
  middleware  = require('../middleware');

const {
  commentsCreate,
  commentsEditPage,
  commentsUpdate,
  commentsDelete, 
  commentsLoadMore,
  commentsVote
} = require('../controllers/comments');


// Post new comment
router.post('/posts/:post_id/comments', middleware.isLoggedIn, commentsCreate);

// Get commments edit page
router.get('/posts/:post_id/comments/:bucket_id/:comment_id/edit', middleware.isLoggedIn, commentsEditPage);

// Update comments
router.put('/comments/:bucket_id/:comment_id', middleware.checkWaitingWall, middleware.checkCommentOwnership, commentsUpdate);

// DELETE comments destroy
router.delete('/posts/:post_id/comments/:bucket_id/:comment_id', middleware.checkWaitingWall, middleware.checkCommentOwnership, commentsDelete);

// Load more comments(AJAX)
router.get('/moreComments/:post_id', middleware.checkWaitingWall, commentsLoadMore);

// Comments upVote(AJAX)
router.put('/comments/:bucket_id/:comment_id/vote', middleware.isLoggedIn, commentsVote);

module.exports = router;