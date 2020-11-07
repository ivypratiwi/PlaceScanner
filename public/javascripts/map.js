function initMap() {
    try {
        const mapdiv = document.getElementById('map');
        const longitude = parseFloat(mapdiv.dataset.longitude);
        const latitude = parseFloat(mapdiv.dataset.latitude);
        const res = { lat: latitude, lng: longitude }
        const map = new google.maps.Map(mapdiv, { zoom: 13, center: res });
        const marker = new google.maps.Marker({ position: res, map: map });
    }
    catch (err) {
        const mapdiv = document.getElementById('map');
        mapdiv.innerHTML = '<h5 class="center">Error in showing map</h5>'
    }
}