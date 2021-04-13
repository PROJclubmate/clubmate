const express   = require('express'),
  router        = express.Router(),
  middleware    = require('../middleware'),
  {enviornment} = require('../config/env_switch.js'),
  {profilesUserProfile, profilesUserMoreClubs, profilesUserMorePosts, profilesUserMoreHeartPosts,
  profilesUpdateUserProfile, profilesNewClub, profilesClubProfile, profilesCluballTimeTopPosts,
  profilesClubMoreMembers, profilesClubSearchMembers, profilesClubMoreMemberRequests, profilesClubMorePosts, 
  profilesUpdateClubProfile, profilesDeleteClubProfile, profilesGetClubsFeaturedPhotos, 
  profilesUpdateClubsFeaturedPhotos, profilesRegisterUserPage, profilesSignUp, profilesVerifyUser, 
  profilesReVerify,  profilesVerificationToken, profilesLoginPage, profilesLoginUser, profilesLogout, 
  profilesForgotPage, profilesForgotPass, profilesForgotToken, profilesResetPass} = 
  require('../controllers/profiles');

if(enviornment === 'dev'){
  var {upload} = require('../config/cloudinary.js');
} else if (enviornment === 'prod'){
  var {upload} = require('../config/s3.js');
}

// Show user profile page
router.get('/users/:id', profilesUserProfile);

// Load user joined clubs(AJAX)
router.get('/users-moreClubs/:user_id', profilesUserMoreClubs);

// Load user created posts(AJAX)
router.get('/users-morePosts/:id', profilesUserMorePosts);

// Load user heart posts(AJAX)
router.get('/heart-morePosts/:id', profilesUserMoreHeartPosts);

// Update user profile
router.put('/users/:id', middleware.isLoggedIn, upload.single('profilePic'), profilesUpdateUserProfile);

// Create new club profile
router.post('/users/:id/clubs', middleware.isLoggedIn, upload.single('avatar'), profilesNewClub);

// Show club profile
router.get('/clubs/:club_id', profilesClubProfile);

// Load all time top topic posts(AJAX)
router.get('/clubs-allTimeTopTopicPosts/:club_id', profilesCluballTimeTopPosts);

// Load club members(AJAX)
router.get('/clubs-moreMembers/:club_id', profilesClubMoreMembers);

// Search club members(AJAX)
router.get('/clubs-searchMembers/:club_id', profilesClubSearchMembers);

// Load users with member-requests(AJAX)
router.get('/clubs-moreMemberRequests/:id', middleware.isLoggedIn, profilesClubMoreMemberRequests);

// Load club posts(AJAX)
router.get('/clubs-morePosts/:club_id', profilesClubMorePosts);

// Update club profile
router.put('/clubs/:club_id', middleware.isLoggedIn, upload.single('avatar'), profilesUpdateClubProfile);

// Delete club profile
router.put('/clubs/:club_id/delete', middleware.isLoggedIn, profilesDeleteClubProfile);

// Get club featured photos page
router.get('/clubs/:id/featured_photos', middleware.isLoggedIn, profilesGetClubsFeaturedPhotos);

// Update club featured photos
router.put('/clubs/:id/featured_photos', middleware.isLoggedIn, upload.single('image'), profilesUpdateClubsFeaturedPhotos);

//============================================
//AUTH ROUTES
//============================================

// Get sign up page
router.get('/register', profilesRegisterUserPage);

// Register new user
router.post('/register', profilesSignUp);

// Verify new user
router.get('/confirmation/:token', profilesVerifyUser);

// Get Resend verification token page
router.get('/resend_verification', profilesReVerify);

// Resend verification token
router.post('/resend_verification', profilesVerificationToken);

// Get Login Page
router.get('/login', profilesLoginPage);

// Login verified user
router.post('/login', profilesLoginUser);

// Logout user
router.get('/logout', profilesLogout);

// Get forgot password page
router.get('/forgot', profilesForgotPage);

// Send password reset token
router.post('/forgot', profilesForgotPass);

// Check passsword reset token
router.get('/reset/:token', profilesForgotToken);

// Reset user password
router.post('/reset/:token', profilesResetPass);

module.exports = router;