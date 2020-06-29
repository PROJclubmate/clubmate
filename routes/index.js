const express  = require('express'),
  router       = express.Router(),
  middleware   = require('../middleware'),
  {indexSubscription, indexRoot, indexHelp, indexFAQ, indexChats, indexChatsOpen, indexCurrentUserInboxCount, 
  indexSearch, indexSearchEmail, indexSearchPeople, indexSearchMorePeople, indexSearchClubs, indexSearchMoreClubs, 
  indexRequests, indexMemberRequests, indexMemberInfo, indexFilterSearchPeople, indexFilterSearchMorePeople, 
  indexFilterSearchClubs, indexFilterSearchMoreClubs, indexViewAllFriends, indexSearchOrgPages, indexSearchMoreOrgPages, 
  indexViewOrgPage, indexOrgPageSettings, indexFollowAllOrgPage, indexFollowClubs, indexShowFollowingClubs} 
  = require('../controllers/index');

// ==================================================
// FOR NOW in urls, org_pages is replaced by colleges
// ==================================================


// New notification subscription
router.post('/api/save-subscription/', middleware.isLoggedIn, indexSubscription);

// Root(Landing) page
router.get('/', indexRoot);

// Help page
router.get('/help', indexHelp);

// FAQ page
router.get('/FAQ', indexFAQ);

// Chats list
router.get('/chats', middleware.isLoggedIn, indexChats);

// Chats list
router.put('/chats', middleware.isLoggedIn, indexChatsOpen);

// Update inbox notifications count
router.put('/user/:id/inbox', middleware.isLoggedIn, indexCurrentUserInboxCount);

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
router.get('/find_colleges/search', indexSearchOrgPages);

// Search organization pages(Load more using AJAX)
router.get('/colleges-moreResults/search/:query', indexSearchMoreOrgPages);

// Friend requests / Club invites
router.put('/requests', middleware.isLoggedIn, indexRequests);

// Member requests
router.put('/clubs/:id/member_requests', middleware.isLoggedIn, indexMemberRequests);

// Edit member-info(status/rank)
router.put('/status-rank', middleware.isLoggedIn, indexMemberInfo);

// View all friends
router.get('/users/:id/all_friends', middleware.isLoggedIn, indexViewAllFriends);

// View organization page
router.get('/colleges/:org_name', indexViewOrgPage);

// Follow all clubs at once in OrgPage
router.put('/colleges/:org_id/followall/user/:user_id', middleware.isLoggedIn, indexFollowAllOrgPage);

// Organization page settings
router.put('/colleges/:org_id/settings/user/:user_id', middleware.isLoggedIn, indexOrgPageSettings);

// Follow clubs
router.put('/users/:user_id/follow/:club_id', middleware.isLoggedIn, indexFollowClubs);

// Show my followed clubs
router.get('/show_following/:id', middleware.isLoggedIn, indexShowFollowingClubs);

module.exports = router;