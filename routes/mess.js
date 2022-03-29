const express = require('express'),
  router      = express.Router(),
  middleware  = require('../middleware');

const {
  messShowFull,
  messUserSelect,
  messEditPage,
  messUpdateMenu, 
  quickmessData,
  messAddPage,
  addNewMess
} = require('../controllers/mess');


// Show full_view mess page
router.get('/mess', middleware.isLoggedIn, messShowFull);

// Change in currentUser userKeys the mess to show menu of
router.put('/mess', middleware.isLoggedIn, messUserSelect);

// Show edit mess menu page
router.get('/mess/edit', middleware.isLoggedIn, messEditPage);

// Edit mess menu items
router.put('/mess/edit', middleware.isLoggedIn, messUpdateMenu);

// Show quickview of today's mess menu(AJAX)
router.get('/quickmess', quickmessData);

// College level admin - Show page to add new mess
router.get('/mess/add', middleware.isLoggedIn, messAddPage);

// College level admin - Add new mess to college
router.post('/mess/add', middleware.isLoggedIn, addNewMess);

module.exports = router;

