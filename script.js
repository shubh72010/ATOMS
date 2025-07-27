// Initialize the map
// We keep the center on Delhi, India with zoom level 13
const map = L.map('map').setView([28.6139, 77.2090], 13);

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

// You can continue to add more Leaflet features here as needed,
// such as circles, polygons, or additional markers.
