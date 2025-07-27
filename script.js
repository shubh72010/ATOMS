// Initialize the map
const map = L.map('map', {
    center: [20.5937, 78.9629], // Centered roughly on India for a starting point
    zoom: 5,
    zoomControl: false // Disable default zoom control to style our own
});

// Add custom zoom controls
L.control.zoom({
    position: 'topright' // Position zoom controls to match NothingOS aesthetic
}).addTo(map);

// Add OpenFreeMap Positron tiles as the base layer
// OpenFreeMap is completely free with no limits or API keys [span_2](start_span)[span_2](end_span)
L.tileLayer('https://tiles.openfreemap.org/styles/positron/{z}/{x}/{y}.png', {
    attribution: 'OpenFreeMap &copy; <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
}).addTo(map);

// --- Geocoding (Search) Functionality ---
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
let searchMarker = null; // To store the current search result marker
let lastSearchTime = 0; // For Nominatim rate limiting

searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        performSearch(query);
    }
});

// Function to display messages to the user
function showMessage(message, duration = 3000) {
    let messageBox = document.getElementById('messageBox');
    if (!messageBox) {
        messageBox = document.createElement('div');
        messageBox.id = 'messageBox';
        document.body.appendChild(messageBox);
    }
    messageBox.textContent = message;
    messageBox.style.display = 'block';
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, duration);
}

async function performSearch(query) {
    const currentTime = Date.now();
    // Nominatim has a limit of 1 request per second [span_0](start_span)[span_0](end_span)
    if (currentTime - lastSearchTime < 1000) {
        showMessage("Please wait a moment before searching again (Nominatim rate limit).");
        return;
    }
    lastSearchTime = currentTime;

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

    try {
        const response = await fetch(nominatimUrl, {
            headers: {
                // Required by Nominatim policy [span_1](start_span)[span_1](end_span)
                'User-Agent': 'NothingMapsApp/1.0 (https://github.com/yourusername/yourrepo)'
            }
        });
        const data = await response.json();

        if (data && data.length > 0) {
            const lat = parseFloat(data.lat);
            const lon = parseFloat(data.lon);
            const name = data.display_name;

            // Remove previous search marker if exists
            if (searchMarker) {
                map.removeLayer(searchMarker);
            }

            // Create a custom NothingOS-styled marker icon
            const nothingIcon = L.divIcon({
                className: 'nothing-marker',
                iconSize: [24, 24], // Size of the SVG
                iconAnchor: [12, 12], // Anchor point of the icon
                popupAnchor: [0, -12] // Point from which the popup should open relative to the iconAnchor
            });

            searchMarker = L.marker([lat, lon], { icon: nothingIcon }).addTo(map)
               .bindPopup(`<b>${name}</b>`).openPopup();
            map.setView([lat, lon], 13); // Zoom to the result
        } else {
            showMessage("Location not found. Please try a different query.");
        }
    } catch (error) {
        console.error("Error during geocoding:", error);
        showMessage("Error searching for location. Please try again.");
    }
}

// --- Routing Functionality ---
const startInput = document.getElementById('startInput');
const endInput = document.getElementById('endInput');
const routeButton = document.getElementById('routeButton');
let routeLayer = null; // To store the current route polyline

// IMPORTANT: Replace 'YOUR_OPENROUTESERVICE_API_KEY' with your actual API key.
// You can get a free API key by registering at https://openrouteservice.org/sign-up [span_3](start_span)[span_3](end_span)
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjQzOTM3ZTJlMzA3NjRiODlhOGQ5MjgyNjlmNzA1Y2EzIiwiaCI6Im11cm11cjY0In0=';

routeButton.addEventListener('click', async () => {
    const startQuery = startInput.value.trim();
    const endQuery = endInput.value.trim();

    if (!startQuery ||!endQuery) {
        showMessage("Please enter both start and end locations for routing.");
        return;
    }

    if (ORS_API_KEY === 'YOUR_OPENROUTESERVICE_API_KEY') {
        showMessage("Please obtain and set your Openrouteservice API key in script.js for routing functionality.");
        return;
    }

    try {
        // Geocode start location
        const startCoords = await geocodeAddress(startQuery);
        if (!startCoords) {
            showMessage("Could not find start location.");
            return;
        }

        // Geocode end location
        const endCoords = await geocodeAddress(endQuery);
        if (!endCoords) {
            showMessage("Could not find end location.");
            return;
        }

        // Request route from Openrouteservice
        await getRoute(startCoords, endCoords);

    } catch (error) {
        console.error("Error during routing process:", error);
        showMessage("Error calculating route. Please try again.");
    }
});

async function geocodeAddress(address) {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(nominatimUrl, {
        headers: {
            'User-Agent': 'NothingMapsApp/1.0 (https://github.com/yourusername/yourrepo)'
        }
    });
    const data = await response.json();
    if (data && data.length > 0) {
        return [parseFloat(data.lon), parseFloat(data.lat)]; // ORS expects [lon, lat][span_4](start_span)[span_4](end_span)
    }
    return null;
}

async function getRoute(startCoords, endCoords) {
    const orsUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${startCoords.join(',')}&end=${endCoords.join(',')}`;

    try {
        const response = await fetch(orsUrl);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const routeGeoJSON = data.features.geometry;

            // Remove previous route if exists
            if (routeLayer) {
                map.removeLayer(routeLayer);
            }

            // Add the new route to the map
            routeLayer = L.geoJSON(routeGeoJSON, {
                style: function (feature) {
                    return {
                        color: 'var(--nothing-red-accent)', // Use NothingOS red accent
                        weight: 4,
                        opacity: 0.8,
                        dashArray: '5, 5' // Dotted line style
                    };
                }
            }).addTo(map);

            // Fit map to route bounds
            map.fitBounds(routeLayer.getBounds());
        } else {
            showMessage("No route found between the specified locations.");
        }
    } catch (error) {
        console.error("Error fetching route:", error);
        showMessage("Error fetching route from Openrouteservice. Check API key or try again later.");
    }
}

// --- Custom Points of Interest (POIs) ---
// Example POIs - these would be hardcoded or loaded from a simple static JSON if allowed
const customPOIs =;

// Create a custom NothingOS-styled marker icon for POIs
const nothingPOIIcon = L.divIcon({
    className: 'nothing-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
});

customPOIs.forEach(poi => {
    L.marker([poi.lat, poi.lon], { icon: nothingPOIIcon }).addTo(map)
       .bindPopup(`<b>${poi.name}</b>`);
});

// Initial message for the user
showMessage("Welcome to Nothing Maps! Enter locations to search or get directions.", 5000);
