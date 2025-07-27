// Initialize the map (initially centered on a default location, will be updated by geolocation)
const map = L.map('map').setView([20.5937, 78.9629], 5); // Default: Center of India, broader zoom

// Add CartoDB Dark Matter tile layer for a dark theme
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

// --- User Location Logic ---
let userMarker; // To store the user's location marker
let accuracyCircle; // To store the accuracy circle
let lastKnownUserLocation = null; // Variable to store the user's last known LatLng

function onLocationFound(e) {
    // Store the location for later use by the button
    lastKnownUserLocation = e.latlng;

    // If a previous marker/circle exists, remove them
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    if (accuracyCircle) {
        map.removeLayer(accuracyCircle);
    }

    const radius = e.accuracy / 2; // Radius for the accuracy circle

    // Add a marker for the user's location
    userMarker = L.marker(e.latlng).addTo(map)
        .bindPopup(`You are within ${radius.toFixed(0)} meters from this point`).openPopup();

    // Add a circle to show the accuracy of the location
    accuracyCircle = L.circle(e.latlng, radius, {
        color: '#1976D2',      // Google Maps-like blue
        fillColor: '#1976D2',
        fillOpacity: 0.15,
        weight: 2
    }).addTo(map);

    // Set the map view to the user's location with a suitable zoom level
    map.setView(e.latlng, 15); // Zoom in closer to the user's location
}

function onLocationError(e) {
    console.error(e.message);
    console.log('Location unavailable or denied. Falling back to Delhi.');
    // Fallback to Delhi if location is not found
    map.setView([28.6139, 77.2090], 13);
    L.marker([28.6139, 77.2090]).addTo(map)
        .bindPopup('<b>Hello world!</b><br />Could not get your location. Displaying Delhi.')
        .openPopup();
}

// Request user's location only once on load
if (!navigator.geolocation) {
    console.error('Geolocation is not supported by your browser');
    console.log('Geolocation not supported. Falling back to Delhi.');
    map.setView([28.6139, 77.2090], 13);
    L.marker([28.6139, 77.2090]).addTo(map)
        .bindPopup('<b>Hello world!</b><br />Geolocation not supported. Displaying Delhi.')
        .openPopup();
} else {
    // Only fetch location once: setView to false, watch to false (default)
    map.locate({setView: false, maxZoom: 16, enableHighAccuracy: true});
}

// Event listeners for Leaflet location events
map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);

// --- "Go to My Location" Button Logic ---
const locationFabButton = document.getElementById('location-fab');

if (locationFabButton) {
    locationFabButton.addEventListener('click', () => {
        if (lastKnownUserLocation) {
            map.setView(lastKnownUserLocation, 15); // Go back to user's last known location
            if (userMarker) {
                userMarker.openPopup(); // Re-open the popup if marker exists
            }
        } else {
            alert('Your location is not available. Please ensure location services are enabled.');
            // Optionally, try to locate again
            map.locate({setView: false, maxZoom: 16, enableHighAccuracy: true});
        }
    });
}


// --- Routing Control (from previous step) ---
L.Routing.control({
    waypoints: [
        L.latLng(28.6139, 77.2090), // Default start (will be replaced by user location if found)
        L.latLng(28.7041, 77.1025)  // Example destination
    ],
    routeWhileDragging: true,
    geocoder: L.Control.Geocoder.nominatim(),
    showAlternatives: true,
}).addTo(map);
