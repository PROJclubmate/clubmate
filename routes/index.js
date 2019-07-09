const express  = require('express'),
  router       = express.Router(),
  middleware   = require('../middleware'),
  {indexRoot, indexSearch, indexSearchEmail, indexSearchPeople, indexSearchMorePeople, indexSearchClubs,
  indexSearchMoreClubs, indexRequests, indexMemberInfo, indexFilterSearchPeople, indexFilterSearchMorePeople,
  indexFilterSearchClubs, indexFilterSearchMoreClubs, indexViewAllFriends} = require('../controllers/index');



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

// Friend requests / Club invites
router.put('/requests', middleware.isLoggedIn, indexRequests);

// Edit member-info(status/rank)
router.put('/status-rank', indexMemberInfo);

// View all friends
router.get('/users/:id/all_friends', middleware.isLoggedIn, indexViewAllFriends);

module.exports = router;