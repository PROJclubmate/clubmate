if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js').then(function(){
    // console.log('Service worker registered!');
  }).catch(function(err){
    // console.log(err);
  });
}

function displayConfirmNotification(){
  if('serviceWorker' in navigator){
    var options = {
      body: 'You will be notified for any new Friend Requests or Club Invites',
      icon: '/images/icons/app-icon-96x96.png',
      // image: '',
      dir: 'ltr',
      lang: 'en-US', //BCP 47
      vibrate: [100, 50, 200, 50, 200],
      badge: '/images/icons/app-icon-96x96.png',
      // tag: 'confirm-notification',
      // renotify: true
    };
    navigator.serviceWorker.ready.then(function(swreg){
      swreg.showNotification('Subscribed!', options);
    })
  }
}

function configurePushSub(){
  if(!('serviceWorker' in navigator)){
    return;
  }

  var reg;
  navigator.serviceWorker.ready.then(function(swreg){
    reg = swreg;
    return swreg.pushManager.getSubscription();
  })
  .then(function(sub){
    if(sub === null){
      // Create a new subscription
      var vapidPublicKey = 'BIlA75fh7DBK0PTVj3oMSnSEVfP8M7HHM6wZFvcUYr_CWnMiQPrZAjP34V-iMGJMCKhBIXlOnfUK5PfR__kjcwM';
      var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
      return reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidPublicKey
      });
    } else{
      // We have a subscription
    }
  }).then(function(newSub){
    return fetch('/api/save-subscription/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(newSub)
    })
  }).then(function(res){
    if(res.ok){
      displayConfirmNotification();
    }
  }).catch(function(err){
    console.log(err);
  });
}

function askForNotificationPermission(){
  Notification.requestPermission(function(result){
    console.log('User choice', result);
    if(result !== 'granted'){
    	console.log('User choice granted!')
      var enable = document.getElementById('enable-notifications');
      if(enable){
        enable.style.display = 'none';
      }
    } else{
      configurePushSub()
      var enable = document.getElementById('enable-notifications');
      if(enable){
        enable.style.display = 'none';
      }
    }
  });
}

var enable = document.getElementById('enable-notifications');
if('Notification' in window && 'serviceWorker' in navigator){
  var permission = Notification.permission;
  if(enable){
    if(permission == 'default'){
      enable.style.display = 'inline-block';
      enable.addEventListener('click', askForNotificationPermission);
    } else if(permission == 'denied' || permission == 'granted'){
      // Let it be hidden
    }
  }
}

function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}