const get = function (array, what) {
  if (array) {
    return array[what] || '';
  } else {
    return '';
  }
}
  
function buildItem(id, type, length, src, preview, link, linkText, seen, time) {
  // Using object short hand (id: id)
  return {
    id,					// item id
    type,				// photo or video
    length,			// photo timeout or video length in seconds - uses 3 seconds timeout for images if not set or 0 for type: video
    src,				// photo or video src
    preview,		// optional - item thumbnail to show in the story carousel instead of the story defined image
    link,				// a link to click on story
    linkText, 	// link text
    seen,		 		// set true if current story was read
    time				// optional a date to display with the story item. unix timestamp are converted to "time ago" format
  };
}


function getStoriesDataInZuckForm(storiesData) {
  // Expected that the first loop gives the club data

  console.log(storiesData);

  const finalStoriesData = [];

  for (club of storiesData) {
    const thisClubStories = [];
    for (story of club.clubStories) {
      thisClubStories.push(buildItem(story._id, 'photo', story.length, story.image, '', '', '', false, 1492665454));
    }

    const thisClubData = {
      id: club.id,
      photo: club.photo,
      name: club.name,
      link: '',
      lastUpdated: club.lastUpdated,
      seen: false,
      items: thisClubStories
    }

    finalStoriesData.push(thisClubData);
  }

  return finalStoriesData;
}

createStory = (ele_id, storiesObject, club, csrfToken , userRank=0) => {

  const clubStories = new Zuck(ele_id, {
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
    stories: storiesObject,	// storiesData object is get from the backend and stored in the discover.ejs,

    callbacks: {
      onOpen(storyId, callback) {
        callback();  // on open story viewer
      },

      onView(storyId) {
        console.log("Story viewed", storyId);

        document.getElementById(`delete-img-${storyId}`).onclick = function() {
          console.log("Delete story", storyId);

          async function postData(url = '', data = {}) {
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(data) // body data type must match "Content-Type" header
            });
            return response.json(); // parses JSON response into native JavaScript objects
          }

          postData(`/clubs/${club._id}/story/delete`, { story_id: storyId, _csrf: csrfToken })
            .then(data => {
              console.log(data); // JSON data parsed by `data.json()` call
            });

          clubStories.remove(storyId);
          clubStories.next();
        }
      },

      onEnd(storyId, callback) {
        callback();  // on end story
      },

      onClose(storyId, callback) {
        callback();  // on close story viewer
      },

      onNavigateItem(storyId, nextStoryId, callback) {
        callback();  // on navigate item of story
      },

      onDataUpdate(currentState, callback) {
        callback(); // use to update state on your reactive framework
      }
    },

    template: {
      // use these functions to render custom templates
      // see src/zuck.js for more details

      // timelineItem (itemData) {
      //   return ``;
      // },

      // timelineStoryItem (itemData) {
      //   return ``;
      // },

      viewerItem(storyData, currentStoryItem) {
        console.log(storyData);
        // console.log(currentStoryItem);
        // console.log(get(storyData[currentStoryItem], 'timeAgo'));

        return `<div class="story-viewer">
          <div class="head">
            <div class="left">
              ${userRank < 3 ? `<span class="item-preview delete-story">
              <img title="Delete Button" id="delete-img-${get(storyData, 'id')}" src="/images/delete.svg" alt="Delete Story">
            </span>`: ''}
              <div class="info">
                <strong class="name">${get(storyData, 'name')}</strong>
                <span class="time">${get(storyData, 'timeAgo')}</span>
              </div>
            </div>
            <div class="right">
              <span class="time">${get(storyData, 'timeAgo')}</span>
              <span class="loading"></span>
              <a class="close" tabIndex="2">&times;</a>
            </div>
          </div>
          <div class="slides-pointers">
            <div class="wrap"></div>
          </div>
        </div>`;
      },

      // viewerItemPointer (index, currentIndex, item) {
      //   return ``;
      // },

      // viewerItemBody (index, currentIndex, item) {
      //   return ``;
      // }
    },

    language: { // if you need to translate :)
      unmute: 'Touch to unmute',
      keyboardTip: 'Press space to see next',
      visitLink: 'Visit link',
      time: {
        ago: 'ago',
        hour: 'hour',
        hours: 'hours',
        minute: 'minute',
        minutes: 'minutes',
        fromnow: 'from now',
        seconds: 'seconds',
        yesterday: 'yesterday',
        tomorrow: 'tomorrow',
        days: 'days'
      }
    }
  });

  return clubStories;
}
