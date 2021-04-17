function geoFindMe(e){
	e.preventDefault();

	const status = document.querySelector('#location_status');
	const locationInput = document.querySelector('#location');

	function success(position){
		setTimeout( () =>{
			const longitude = position.coords.longitude;
			const latitude = position.coords.latitude;
			status.textContent = '';
			status.style.display = 'none';
			locationInput.value = `[${longitude}, ${latitude}]`;
		}, 1000);
	}

	function error(){
		status.textContent = 'Unable to retrieve your location';
	}

	if (!navigator.geolocation){
		status.style.display = 'block';
		status.textContent = 'Geolocation is not supported in your browser';
	} else{
		status.style.display = 'block';
		status.textContent = 'Locating...';
		navigator.geolocation.getCurrentPosition(success, error);
	}
}

document.querySelector('#find-me').addEventListener('click', geoFindMe);