// Initialize the map with the dark theme
const map = L.map('map').setView([28.6139, 77.2090], 13); // Centered on Delhi, India with zoom level 13

// Add CartoDB Dark Matter tile layer for a dark theme
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

// Add a marker (optional, but good for demonstrating functionality)
L.marker([28.6139, 77.2090]).addTo(map)
    .bindPopup('<b>Hello world!</b><br />This is Delhi, India.')
    .openPopup();

// Initialize the routing control
// This will add input fields for origin and destination, and display the route.
L.Routing.control({
    waypoints: [
        L.latLng(28.6139, 77.2090), // Example starting point (Delhi)
        L.latLng(28.7041, 77.1025)  // Example destination (another point in Delhi, e.g., Connaught Place area)
    ],
    routeWhileDragging: true, // Recalculate route while dragging waypoints
    geocoder: L.Control.Geocoder.nominatim(), // Use Nominatim for address search (optional, but useful)
    // You can customize the routing service if needed, for example:
    // router: L.Routing.osrmv1({
    //     serviceUrl: 'http://router.project-osrm.org/route/v1' // Public OSRM demo server
    // }),
    showAlternatives: true, // Show alternative routes
    // For the frosted UI, we might want to style the routing control.
    // However, direct styling of the control's internal elements can be complex.
    // The control itself will float on top of the map.
}).addTo(map);

// Optional: Update coordinates in the info box when the map moves
const coordinatesSpan = document.getElementById('coordinates');
map.on('moveend', function() {
    const center = map.getCenter();
    coordinatesSpan.textContent = `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`;
});

// Initial update for the info box
const initialCenter = map.getCenter();
coordinatesSpan.textContent = `${initialCenter.lat.toFixed(4)}, ${initialCenter.lng.toFixed(4)}`;
