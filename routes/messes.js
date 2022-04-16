const express = require('express'),
  router      = express.Router(),
  middleware  = require('../middleware');

const {
  messShowFull,
  messUserChange,
  messEditPage,
  messUpdateMenu, 
  quickmessData
} = require('../controllers/messes');


// Show full_view mess page
router.get('/colleges/:college_name/mess', middleware.isInCollege, messShowFull);

// Change in currentUser userKeys the mess to show menu of
router.put('/colleges/:college_name/mess', middleware.isInCollege, messUserChange);

// Show edit mess menu page
router.get('/colleges/:college_name/mess/edit', middleware.isInCollege, messEditPage);

// Edit mess menu items
router.put('/colleges/:college_name/mess/edit', middleware.isInCollege, messUpdateMenu);

// Show quickview of today's mess menu(AJAX)
router.get('/colleges/:college_name/quickmess', middleware.isLoggedIn, quickmessData);

module.exports = router;

