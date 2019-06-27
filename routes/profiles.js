const express  = require('express'),
  router       = express.Router(),
  middleware   = require('../middleware'),
  multer       = require('multer'),
  {profilesUserProfile, profilesUserMoreClubs, profilesUserMorePosts, profilesUserMoreHeartPosts,
  profilesUpdateUserProfile, profilesNewClub, profilesClubProfile, profilesClubMoreMembers,
	profilesClubMorePosts, profilesUpdateClubProfile, profilesDeleteClubProfile, profilesGetUsersFeaturedPhotos,
	profilesUpdateUsersFeaturedPhotos, profilesGetClubsFeaturedPhotos, profilesUpdateClubsFeaturedPhotos,
	profilesRegisterUserPage, profilesSignUp, profilesVerifyUser, profilesReVerify, profilesVerificationToken,
	profilesLoginPage, profilesLoginUser, profilesLogout, profilesForgotPage, profilesForgotPass, profilesForgotToken,
	profilesResetPass} = require('../controllers/profiles');

const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
    return cb(new Error('Only image files are allowed!'), false);
  }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter});



// Show user profile
router.get('/users/:id', profilesUserProfile);

// Load user's joined clubs(AJAX)
router.get('/users-moreClubs/:user_id', profilesUserMoreClubs);

// Load user's created posts
router.get('/users-morePosts/:id', profilesUserMorePosts);

// Load user's heart posts
router.get('/heart-morePosts/:id', profilesUserMoreHeartPosts);

// Update user profile
router.put('/users/:id', middleware.checkAccountOwnership, upload.single('profilePic'), profilesUpdateUserProfile);

// Create new club profile
router.post('/users/:id/clubs', middleware.checkAccountOwnership, upload.single('avatar'), profilesNewClub);

// Show club profile
router.get('/clubs/:club_id', profilesClubProfile);

// Load club's members(AJAX)
router.get('/clubs-moreMembers/:club_id', profilesClubMoreMembers);

// Load club's posts(AJAX)
router.get('/clubs-morePosts/:club_id', profilesClubMorePosts);

// Update club profile
router.put('/clubs/:club_id', middleware.isLoggedIn, upload.single('avatar'), profilesUpdateClubProfile);

// Delete club profile
router.delete('/clubs/:club_id', profilesDeleteClubProfile);

// Get user's featured photos page
router.get('/users/:id/featured_photos', middleware.checkAccountOwnership, profilesGetUsersFeaturedPhotos);

// Update user's featured photos
router.put('/users/:id/featured_photos', middleware.checkAccountOwnership, upload.single('image'), profilesUpdateUsersFeaturedPhotos);

// Get club's featured photos page
router.get('/clubs/:id/featured_photos', middleware.checkClubAdminship, profilesGetClubsFeaturedPhotos);

// Update club's featured photos
router.put('/clubs/:id/featured_photos', middleware.checkClubAdminship, upload.single('image'), profilesUpdateClubsFeaturedPhotos);

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
router.put('/resend_verification', profilesVerificationToken);

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

// POST profiles create new
router.post('/reset/:token', profilesResetPass);

module.exports = router;