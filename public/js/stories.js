function buildItem(id, type, length, src, preview, link, linkText, seen, time){
	// Using object short hand (id: id)
	return{
		id,					// item id
		type,				// photo or video
		length,			// photo timeout or video length in seconds - uses 3 seconds timeout for images if not set or 0 or type: video
		src,				// photo or video src
		// preview,	// simillar to Youtube/Facebook stories
		preview,		// optional - item thumbnail to show in the story carousel instead of the story defined image
		link,				// a link to click on story
		linkText, 	// link text
		seen,		 		// set true if current story was read
		time				// optional a date to display with the story item. unix timestamp are converted to "time ago" format
	};
}

const stories = new Zuck('stories', {
	skin: 'Facesnap',					// container class
	avatars: true,						// shows user photo instead of last story item preview
	list: false,							// displays a timeline instead of carousel
	openEffect: true, 				// enables effect when opening story
	cubeEffect: false,				// enables the 3d cube effect when sliding story
	autoFullScreen: true,			// enables fullscreen on mobile browsers
	backButton: true,					// adds a back button to close the story viewer
	backNative: true,					// uses window history to enable back button on browsers/android
	previousTap: true,				// use 1/3 of the screen to navigate to previous item when tap the story
	paginationArrows: false,	// indicator icons
	localStorage: false,			// set true to save "seen" position. Element must have a id to save properly.
	reactive: false,					// set true if you use frameworks like React to control the timeline (see react.sample.html)
	rtl: false, 							// enable/disable RTL
	stories: [
		{
			id:'ramon',
			photo:'https://raw.githubusercontent.com/ramon82/assets/master/zuck.js/users/1.jpg',
			name:'Ramon',
			link:'',
			lastUpdated:1492665454,
			seen: true,
			items: [
			buildItem('ramon-1', 'photo', 3, 'https://pbs.twimg.com/profile_images/782474226020200448/zDo-gAo0_400x400.jpg', '', '', '', true, 1492665454),
			buildItem('ramon-2', 'photo', 3, 'https://vignette4.wikia.nocookie.net/ironman/images/5/59/Robert-Downey-Jr-Tony-Stark-Iron-Man-3-Marvel-Disney.jpg/revision/latest?cb=20130611164804', '', '', '', true, 1492665454),
			buildItem('ramon-3', 'video', 0, 'https://raw.githubusercontent.com/ramon82/assets/master/zuck.js/stories/2.mp4', '', '', '', true, 1492665454),
			buildItem('ramon-4', 'photo', 3, 'https://raw.githubusercontent.com/ramon82/assets/master/zuck.js/stories/3.png', '', 'https://ramon.codes', 'Visit my Portfolio', true, 1492665454)
			]
		},
		{
			id:'gorillaz',
			photo:'https://raw.githubusercontent.com/ramon82/assets/master/zuck.js/users/2.jpg',
			name:'Gorillaz',
			link:'',
			lastUpdated:1492665454,
			seen: false,
			items: [
			buildItem('gorillaz-1', 'video', 0, 'https://raw.githubusercontent.com/ramon82/assets/master/zuck.js/stories/4.mp4', '', '', '', false, 1492665454),
			buildItem('gorillaz-2', 'photo', 3, 'https://raw.githubusercontent.com/ramon82/assets/master/zuck.js/stories/5.jpg', '', '', '', false, 1492665454)
			]
		},
		{
			id:'ladygaga',
			photo:'https://raw.githubusercontent.com/ramon82/assets/master/zuck.js/users/3.jpg',
			name:'Lady Gaga',
			link:'',
			lastUpdated:1492665454,
			seen: false,
			items: [
			buildItem('ladygaga-1', 'photo', 5, 'https://raw.githubusercontent.com/ramon82/assets/master/zuck.js/stories/6.jpg', '', '', '', false, 1492665454),
			buildItem('ladygaga-2', 'photo', 3, 'https://raw.githubusercontent.com/ramon82/assets/master/zuck.js/stories/7.jpg', '', 'http://ladygaga.com', '', false, 1492665454)
			]
		},
		{
			id:'starboy',
			photo:'https://raw.githubusercontent.com/ramon82/assets/master/zuck.js/users/4.jpg',
			name:'The Weeknd',
			link:'',
			lastUpdated:1492665454,
			seen: true,
			items: [
			buildItem('starboy', 'photo', 5, 'https://raw.githubusercontent.com/ramon82/assets/master/zuck.js/stories/8.jpg', '', '', '', false, 1492665454)
			]
		},
		{
			id:'riversquomo',
			photo:'https://raw.githubusercontent.com/ramon82/assets/master/zuck.js/users/5.jpg',
			name:'Rivers Cuomo',
			link:'',
			lastUpdated:1492665454,
			seen: false,
			items: [
			buildItem('riverscuomo', 'photo', 10, 'https://raw.githubusercontent.com/ramon82/assets/master/zuck.js/stories/9.jpg', '', '', '', false, 1492665454)
			]
		}
	],
	
	callbacks:  {
    onOpen (storyId, callback) {
      callback();  // on open story viewer
    },

    onView (storyId) {
      // on view story
    },

    onEnd (storyId, callback) {
      callback();  // on end story
    },

    onClose (storyId, callback) {
      callback();  // on close story viewer
    },

    onNavigateItem (storyId, nextStoryId, callback) {
      callback();  // on navigate item of story
    },

    onDataUpdate (currentState, callback) {
      callback(); // use to update state on your reactive framework
    }
  },

	// template: {
  //   // use these functions to render custom templates
  //   // see src/zuck.js for more details

  //   timelineItem (itemData) {
  //     return ``;
  //   },

  //   timelineStoryItem (itemData) {
  //     return ``;
  //   },

  //   viewerItem (storyData, currentStoryItem) {
  //     return ``;
  //   },

  //   viewerItemPointer (index, currentIndex, item) {
  //     return ``;
  //   },

  //   viewerItemBody (index, currentIndex, item) {
  //     return ``;
  //   }
  // },

  language: { // if you need to translate :)
    unmute: 'Touch to unmute',
    keyboardTip: 'Press space to see next',
    visitLink: 'Visit link',
    time: {
      ago:'ago', 
      hour:'hour', 
      hours:'hours', 
      minute:'minute', 
      minutes:'minutes', 
      fromnow: 'from now', 
      seconds:'seconds', 
      yesterday: 'yesterday', 
      tomorrow: 'tomorrow', 
      days:'days'
    }
	}
});