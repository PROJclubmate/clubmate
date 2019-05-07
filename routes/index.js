const express  = require('express'),
  router       = express.Router(),
  middleware   = require('../middleware'),
  {indexRoot, indexSearch, indexSearchEmail, indexSearchPeople, indexSearchMorePeople, indexSearchClubs,
  indexSearchMoreClubs, indexRequests, indexMemberInfo, indexViewAllFriends, indexViewAllMoreFriends
	} = require('../controllers/index');



// Root(Landing) page
router.get('/', indexRoot);

// Search
router.get('/search', indexSearch);

// Search using email
router.get('/find_email/search', indexSearchEmail);

// Search people
router.get('/find_people/search', indexSearchPeople);

// Search people(Load more using AJAX)
router.get('/people-moreResults/search/:query', indexSearchMorePeople);

// Search clubs
router.get('/find_clubs/search', indexSearchClubs);

// Search clubs(Load more using AJAX)
router.get('/clubs-moreResults/search/:query', indexSearchMoreClubs);

// Friend requests / Club invites
router.put('/requests', middleware.isLoggedIn, indexRequests);

// Edit member-info(status/rank)
router.put('/status-rank', indexMemberInfo);

// View all friends
router.get('/users/:id/all_friends', indexViewAllFriends);

// View all friends(Load more using AJAX)
router.get('/users-moreFriends/:id/all_friends', indexViewAllMoreFriends);

module.exports = router;