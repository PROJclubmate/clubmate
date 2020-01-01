$('#drop-info').click(()=>{
	if(!$('#map').hasClass('mapboxgl-map')){
		mapboxgl.accessToken = 'pk.eyJ1IjoiZ2hvc3QxMjU0IiwiYSI6ImNqdmVzenRhMzI1bDg0NHA4Z3VkMmh4cHEifQ.tb3ff1Hqpw9hezxknR5cOg';

		if(club.geometry && club.geometry!=undefined){
			var map = new mapboxgl.Map({
			  container: 'map',
			  style: 'mapbox://styles/mapbox/light-v9',
			  center: club.geometry.coordinates,
			  zoom: 10
			});

		// create a HTML element for club location/marker
		var el = document.createElement('div');
		el.className = 'marker';

		// make a marker for each feature and add to the map
		new mapboxgl.Marker(el)
		.setLngLat(club.geometry.coordinates)
		.setPopup(new mapboxgl.Popup({ offset: 25 }) // add popups
		.setHTML('<h6>' + club.name + '</h6><p>' + club.clubKeys.location + '</p>'))
		.addTo(map);
		}
	}
});