const express = require('express'),
  router      = express.Router(),
  middleware  = require('../middleware');

const {
  indexSubscription,
  indexRoot,
  indexAbout,
  indexHelp,
  indexSearch,
  indexSearchEmail,
  indexSearchUsers, 
  indexSearchMoreUsers,
  indexSearchClubs,
  indexSearchMoreClubs,
  indexRequests,
  indexMemberRequests,
  indexMemberInfo, 
  indexFilterSearchUsers,
  indexFilterSearchMoreUsers,
  indexFilterSearchClubs,
  indexFilterSearchMoreClubs, 
  indexViewAllStudents,
  indexSearchCollegePages,
  indexSearchMoreCollegePages,
  indexViewCollegePage,
  indexCollegePageSettings,
  indexFollowAllCollegePage,
  indexFollowClubs,
  indexShowFollowingClubs,
  indexSettingsPage,
  indexSettingsPagePost,
  indexFeedbackPage
} = require('../controllers/index');


// New notification subscription
router.post('/api/save-subscription/', middleware.isLoggedIn, indexSubscription);

// Root(Landing) page
router.get('/', indexRoot);

// About page
router.get('/about', indexAbout);

// Help page
router.get('/help', indexHelp);

// Search
router.get('/search', middleware.checkWaitingWall, indexSearch);

// Search using email
router.get('/find_email/search', middleware.checkWaitingWall, indexSearchEmail);

// Search users
router.get('/find_users/search', middleware.checkWaitingWall, indexSearchUsers);

// Search users(Load more using AJAX)
router.get('/users-moreResults/search/:query', middleware.checkWaitingWall, indexSearchMoreUsers);

// Filter search users
router.get('/find_users/filter_search', middleware.checkWaitingWall, middleware.searchAndFilterUsers, indexFilterSearchUsers);

// Filter search users(Load more using AJAX)
router.get('/users-moreResults/filter_search', middleware.checkWaitingWall, indexFilterSearchMoreUsers);

// Search clubs
router.get('/find_clubs/search', middleware.checkWaitingWall, indexSearchClubs);

// Search clubs(Load more using AJAX)
router.get('/clubs-moreResults/search/:query', middleware.checkWaitingWall, indexSearchMoreClubs);

// Filter search clubs
router.get('/find_clubs/filter_search', middleware.checkWaitingWall, middleware.searchAndFilterClubs, indexFilterSearchClubs);

// Filter search clubs(Load more using AJAX)
router.get('/clubs-moreResults/filter_search', middleware.checkWaitingWall, indexFilterSearchMoreClubs);

// Search college pages
router.get('/find_colleges/search', middleware.checkWaitingWall, indexSearchCollegePages);

// Search college pages(Load more using AJAX)
router.get('/colleges-moreResults/search/:query', middleware.checkWaitingWall, indexSearchMoreCollegePages);

// Club invites
router.put('/requests', middleware.isLoggedIn, indexRequests);

// Member requests
router.put('/clubs/:id/member_requests', middleware.isLoggedIn, indexMemberRequests);

// Edit member-info(status/rank)
router.put('/status-rank', middleware.isLoggedIn, indexMemberInfo);

// View list of all students in college
router.get('/all_students/colleges/:college_key', middleware.checkWaitingWall, middleware.searchAndFilterUsers, indexViewAllStudents);

// View college page
router.get('/colleges/:college_name', middleware.checkWaitingWall, indexViewCollegePage);

// Follow all clubs at once in CollegePage
router.put('/colleges/:college_id/followall/user/:user_id', middleware.isLoggedIn, indexFollowAllCollegePage);

// College page settings
router.put('/colleges/:college_id/settings/user/:user_id', middleware.isLoggedIn, indexCollegePageSettings);

// Follow clubs
router.put('/users/:user_id/follow/:club_id', middleware.isLoggedIn, indexFollowClubs);

// Show my followed clubs
router.get('/show_following/:id', middleware.isLoggedIn, indexShowFollowingClubs);

// Get account settings page
router.get('/users/:id/settings', middleware.isLoggedIn, indexSettingsPage);

// Post account settings page
router.post('/users/:id/settings', middleware.isLoggedIn, indexSettingsPagePost);

// Get user feedback page
router.get('/feedback', middleware.isLoggedIn, indexFeedbackPage);

module.exports = router;