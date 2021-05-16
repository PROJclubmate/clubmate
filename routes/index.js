const express  = require('express'),
  router       = express.Router(),
  middleware   = require('../middleware'),
  {indexSubscription, indexRoot, indexHelp, indexFAQ, indexSearch, indexSearchEmail, indexSearchPeople, 
  indexSearchMorePeople, indexSearchClubs, indexSearchMoreClubs, indexRequests, indexMemberRequests, indexMemberInfo, 
  indexFilterSearchPeople, indexFilterSearchMorePeople, indexFilterSearchClubs, indexFilterSearchMoreClubs, 
  indexViewAllFriends, indexViewAllStudents, indexSearchCollegePages, indexSearchMoreCollegePages, indexViewCollegePage,
  indexCollegePageSettings, indexFollowAllCollegePage, indexFollowClubs, indexShowFollowingClubs, indexSettingsPage,
  indexSettingsPagePost, indexFeedbackPage} = require('../controllers/index');


// New notification subscription
router.post('/api/save-subscription/', middleware.isLoggedIn, indexSubscription);

// Root(Landing) page
router.get('/', indexRoot);

// Help page
router.get('/help', indexHelp);

// FAQ page
router.get('/faq', indexFAQ);

// Search
router.get('/search', indexSearch);

// Search using email
router.get('/find_email/search', indexSearchEmail);

// Search people
router.get('/find_people/search', indexSearchPeople);

// Search people(Load more using AJAX)
router.get('/people-moreResults/search/:query', indexSearchMorePeople);

// Filter search people
router.get('/find_people/filter_search', middleware.searchAndFilterPeople, indexFilterSearchPeople);

// Filter search people(Load more using AJAX)
router.get('/people-moreResults/filter_search', indexFilterSearchMorePeople);

// Search clubs
router.get('/find_clubs/search', indexSearchClubs);

// Search clubs(Load more using AJAX)
router.get('/clubs-moreResults/search/:query', indexSearchMoreClubs);

// Filter search clubs
router.get('/find_clubs/filter_search', middleware.searchAndFilterClubs, indexFilterSearchClubs);

// Filter search clubs(Load more using AJAX)
router.get('/clubs-moreResults/filter_search', indexFilterSearchMoreClubs);

// Search college pages
router.get('/find_colleges/search', indexSearchCollegePages);

// Search college pages(Load more using AJAX)
router.get('/colleges-moreResults/search/:query', indexSearchMoreCollegePages);

// Friend requests / Club invites
router.put('/requests', middleware.isLoggedIn, indexRequests);

// Member requests
router.put('/clubs/:id/member_requests', middleware.isLoggedIn, indexMemberRequests);

// Edit member-info(status/rank)
router.put('/status-rank', middleware.isLoggedIn, indexMemberInfo);

// View all friends
router.get('/users/:id/all_friends', middleware.isLoggedIn, indexViewAllFriends);

// View list of all students in college
router.get('/all_students/colleges/:college_key', middleware.searchAndFilterPeople, indexViewAllStudents);

// View college page
router.get('/colleges/:college_name', indexViewCollegePage);

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
