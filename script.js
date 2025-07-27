// Initialize the map with the dark theme
const map = L.map('map').setView([28.6139, 77.2090], 13); // Centered on Delhi, India with zoom level 13

// Add CartoDB Dark Matter tile layer for a dark theme
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

// Add a marker (optional)
L.marker([28.6139, 77.2090]).addTo(map)
    .bindPopup('<b>Hello world!</b><br />This is Delhi, India.')
    .openPopup();

// Initialize the routing control
// It will appear in the top-left by default.
L.Routing.control({
    waypoints: [
        L.latLng(28.6139, 77.2090), // Example starting point (Delhi)
        L.latLng(28.7041, 77.1025)  // Example destination (another point in Delhi)
    ],
    routeWhileDragging: true,
    geocoder: L.Control.Geocoder.nominatim(),
    showAlternatives: true,
}).addTo(map);

// Update coordinates in the info box when the map moves
const coordinatesSpan = document.getElementById('coordinates');
map.on('moveend', function() {
    const center = map.getCenter();
    coordinatesSpan.textContent = `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`;
});

// Initial update for the info box
const initialCenter = map.getCenter();
coordinatesSpan.textContent = `${initialCenter.lat.toFixed(4)}, ${initialCenter.lng.toFixed(4)}`;
