const express  = require('express'),
  router       = express.Router(),
  middleware   = require('../middleware'),
  {indexSubscription, indexRoot, indexHelp, indexFAQ, indexSearch, indexSearchEmail, indexSearchPeople,
  indexSearchMorePeople, indexSearchClubs, indexSearchMoreClubs, indexRequests, indexMemberRequests, indexMemberInfo,
  indexFilterSearchPeople, indexFilterSearchMorePeople, indexFilterSearchClubs, indexFilterSearchMoreClubs,
  indexViewAllFriends, indexSearchOrgPages, indexSearchMoreOrgPages, indexViewOrgPage, indexFollowOrgPage, 
	indexUnFollowingClub} = require('../controllers/index');




// New notification subscription
router.post('/api/save-subscription/', middleware.isLoggedIn, indexSubscription);

// Root(Landing) page
router.get('/', indexRoot);

// Help page
router.get('/help', indexHelp);

// FAQ page
router.get('/FAQ', indexFAQ);

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

// Search organization pages
router.get('/find_org_pages/search', indexSearchOrgPages);

// Search organization pages(Load more using AJAX)
router.get('/org_pages-moreResults/search/:query', indexSearchMoreOrgPages);

// Friend requests / Club invites
router.put('/requests', middleware.isLoggedIn, indexRequests);

// Member requests
router.put('/clubs/:id/member_requests', middleware.isLoggedIn, indexMemberRequests);

// Edit member-info(status/rank)
router.put('/status-rank', indexMemberInfo);

// View all friends
router.get('/users/:id/all_friends', middleware.isLoggedIn, indexViewAllFriends);

// View organization page
router.get('/org_pages/:org_name', indexViewOrgPage);

// Follow organization page
router.put('/org_pages/:org_id/follow/:user_id', indexFollowOrgPage);

// Un-Follow individual clubs
router.put('/users/:user_id/unfollow/:club_id', indexUnFollowingClub);

module.exports = router;