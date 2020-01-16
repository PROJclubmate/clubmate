self.addEventListener('install', function(event){
	// console.log('[Service Worker] Installing service worker ...', event);
});

self.addEventListener('activate', function(event){
	// console.log('[Service Worker] Activating service worker ...', event);
	return self.clients.claim();
});

self.addEventListener('fetch', function(event){
	// console.log('[Service Worker] Fetching something ...', event);
	event.respondWith(fetch(event.request));
});

self.addEventListener('notificationclick', function(event){
	var notification = event.notification;
	var action = event.action;
	if(action === 'close'){
		notification.close();
	// } else if(action === 'confirm'){
	// 	console.log('Confirm was chosen');
	// 	notification.close();
	} else{
		event.waitUntill(
			clients.matchAll()
			.then(function(clis){
				var client = clis.find(function(c){
					return c.visibilityState === 'visible';
				});

				if(client !== undefined){
					client.navigate(notification.data.url);
					client.focus();
				} else{
					clients.openWindow(notification.data.url);
				}
				notification.close();
			})
		);
	}
});

self.addEventListener('notificationclose', function(event){
	// console.log('Notification was closed', event);
});

self.addEventListener('push', function(event){
	// console.log('Push notification received', event);

	var data = {title: 'Notification', content: 'New request', icon: '/images/icons/app-icon-96x96.png', openUrl: '/'};

	if(event.data){
		data = JSON.parse(event.data.text());
	}
	var options = {
    body: data.title,
    icon: data.content,
    dir: 'ltr',
    lang: 'en-US', //BCP 47
    vibrate: [100, 50, 200, 50, 200],
    badge: '/images/icons/app-icon-96x96.png',
    data: {
    	url: data.openUrl
    },
    // tag: 'new-request',
    // renotify: true
  };

  var request1 = data.title.includes('invite');
  var request2 = data.title.includes('request');
  if(request1 && !request2){
  	event.waitUntill(self.registration.showNotification('Club Invite', options));
  } else if(!request1 && request2){
  	event.waitUntill(self.registration.showNotification('Friend Request', options));
  } else{
  	event.waitUntill(self.registration.showNotification('New', options));
  }
});