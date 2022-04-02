const express       = require("express"),
  router            = express.Router(),
  middleware        = require("../middleware");

const {
  postsDiscoverSettings,
  postsDiscover,
  postsDiscoverMorePosts,
  postsCreate,
  postsView,
  subPostQuote,
  postsUpdate,
  postsDelete,
  postsVote,
  postsModVote
} = require("../controllers/posts");

if (process.env.ENVIRONMENT === "dev") {
  var { upload } = require("../config/cloudinary.js");
} else if (process.env.ENVIRONMENT === "prod") {
  var { upload } = require("../config/s3.js");
}


// Discover settings
router.put("/discover/settings/user/:id", middleware.isLoggedIn, postsDiscoverSettings);

// Discover page
router.get("/discover", middleware.checkWaitingWall, postsDiscover);

// Discover load more posts(AJAX)
router.get("/discover-morePosts", middleware.checkWaitingWall, postsDiscoverMorePosts);

// Create new post
router.post("/clubs/:club_id/posts", middleware.isLoggedIn, upload.single("image"), postsCreate);

// View post
router.get("/clubs/:club_id/posts/:post_id", middleware.checkWaitingWall, postsView);

// Quote a subPost
router.get("/clubs/:club_id/posts/:post_id/subPost/:bucket_id", middleware.isLoggedIn, subPostQuote);

// Update post
router.put("/clubs/:club_id/posts/:post_id", middleware.isLoggedIn, postsUpdate);

// Delete post
router.delete("/clubs/:club_id/posts/:post_id", middleware.isLoggedIn, postsDelete);

// Vote (AJAX)
router.put("/posts/:post_id/vote", middleware.isLoggedIn, postsVote);

// ModVote (AJAX)
router.put("/posts/:post_id/modvote", middleware.isLoggedIn, postsModVote);

module.exports = router;