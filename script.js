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

// --- Routing Control ---
// Store a reference to the routing control instance
let routingControl = L.Routing.control({
    // Use OpenRouteService for routing calculations
    // !!! IMPORTANT: Replace 'YOUR_OPENROUTESERVICE_API_KEY' with your actual key !!!
    router: L.Routing.openrouteservice('YOUR_OPENROUTESERVICE_API_KEY', {
        serviceUrl: 'https://api.openrouteservice.org/v2/directions/',
        profile: 'driving-car' // or 'cycling', 'walking', 'driving-hgv', 'driving-motorcycle'
    }),
    waypoints: [
        L.latLng(28.6139, 77.2090), // Default start
        L.latLng(28.7041, 77.1025)  // Example destination
    ],
    routeWhileDragging: true,
    // Keep Nominatim for geocoding waypoints initially for routing control's own inputs
    geocoder: L.Control.Geocoder.nominatim(), 
    showAlternatives: true,
    collapsible: true // Make the routing control collapsible
}).addTo(map);

// Hide the routing control initially
routingControl.hide();

// --- Plus Button (+) (FAB) Functionality (for new route) ---
const plusFabButton = document.querySelector('.fab.main-fab'); // Selects the FAB with class 'main-fab'
let searchResultMarker = null; // To keep track of the temporary search result marker

if (plusFabButton) {
    plusFabButton.addEventListener('click', () => {
        // Clear existing waypoints to start a new route
        routingControl.setWaypoints([]);
        routingControl.show(); // Show the routing control panel
        alert('Ready for a new route! Click on the map for start/end points, or use the panel.');

        // Optionally, remove the temporary search marker if it exists
        if (searchResultMarker) {
            map.removeLayer(searchResultMarker);
            searchResultMarker = null;
        }
    });
}


// --- Search Bar and Autofill Functionality ---
const searchInput = document.querySelector('.main-search-bar input');
const searchIcon = document.querySelector('.main-search-bar .material-icons:first-child'); // Assuming first icon is search
const searchSuggestionsContainer = document.querySelector('.search-suggestions'); // New element for suggestions

// Initialize Nominatim geocoder separately for direct search and autofill
const geocoder = L.Control.Geocoder.nominatim();

// Debounce function to limit API calls during typing
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Function to clear suggestions
function clearSuggestions() {
    searchSuggestionsContainer.innerHTML = '';
    searchSuggestionsContainer.style.display = 'none'; // Hide the container
}

// Function to handle input for autofill
const handleSearchInput = debounce((e) => {
    const query = e.target.value.trim();

    if (query.length < 3) { // Only search if query is at least 3 characters
        clearSuggestions();
        return;
    }

    geocoder.geocode(query, function(results) {
        clearSuggestions(); // Clear previous suggestions
        if (results && results.length > 0) {
            searchSuggestionsContainer.style.display = 'block'; // Show the container
            results.forEach(result => {
                const suggestionItem = document.createElement('div');
                suggestionItem.classList.add('suggestion-item');
                suggestionItem.textContent = result.name;
                // Store data for later use when clicked
                suggestionItem.dataset.lat = result.center.lat;
                suggestionItem.dataset.lng = result.center.lng;
                suggestionItem.dataset.name = result.name;

                suggestionItem.addEventListener('click', () => {
                    searchInput.value = suggestionItem.dataset.name; // Populate search bar
                    clearSuggestions(); // Clear suggestions
                    performSearch(); // Perform the full search for the selected item
                });
                searchSuggestionsContainer.appendChild(suggestionItem);
            });
        }
    });
}, 300); // Debounce delay of 300ms

// Add event listener for input (typing)
searchInput.addEventListener('input', handleSearchInput);

// Hide suggestions when search input loses focus (with a slight delay to allow click)
searchInput.addEventListener('blur', () => {
    setTimeout(clearSuggestions, 200);
});

// Original performSearch function (now also called by autofill click)
function performSearch() {
    const query = searchInput.value; // Get value directly from input (might be autofilled)
    if (query.trim() === '') {
        alert('Please enter a place to search.');
        return;
    }

    geocoder.geocode(query, function(results) {
        if (results && results.length > 0) {
            const firstResult = results[0];
            map.setView(firstResult.center, 15); // Center map on result

            // Clear previous search marker if any
            if (searchResultMarker) {
                map.removeLayer(searchResultMarker);
            }

            // Create HTML content for the popup including the "Set as Destination" button
            const popupContent = `
                <b>${firstResult.name}</b><br>
                ${firstResult.html || ''}<br><br>
                <button class="set-destination-btn"
                        data-lat="${firstResult.center.lat}"
                        data-lng="${firstResult.center.lng}"
                        style="
                            background-color: #1976D2;
                            color: white;
                            border: none;
                            padding: 8px 12px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 0.9em;
                            margin-top: 10px;
                        ">Set as Destination</button>
            `;

            // Add a new marker for the search result
            searchResultMarker = L.marker(firstResult.center).addTo(map)
                .bindPopup(popupContent);
            
            // Open the popup immediately
            searchResultMarker.openPopup();

            // IMPORTANT: Add event listener to the button once the popup is open
            searchResultMarker.on('popupopen', function() {
                // Select the button *within* the popup's actual DOM element
                const popupDomElement = searchResultMarker.getPopup().getElement();
                const setDestinationBtn = popupDomElement ? popupDomElement.querySelector('.set-destination-btn') : null;

                if (setDestinationBtn) {
                    setDestinationBtn.addEventListener('click', function() {
                        const lat = parseFloat(this.dataset.lat);
                        const lng = parseFloat(this.dataset.lng);
                        const destinationLatLng = L.latLng(lat, lng);

                        // Determine start point: user's location if known, else map center
                        const startPoint = lastKnownUserLocation || map.getCenter();

                        // Set waypoints for routing
                        routingControl.setWaypoints([
                            startPoint,
                            destinationLatLng
                        ]);
                        routingControl.show(); // Show the routing panel
                        map.closePopup(); // Close the search result popup
                        // Optionally, remove the temporary search marker
                        if (searchResultMarker) {
                            map.removeLayer(searchResultMarker);
                            searchResultMarker = null;
                        }
                    });
                } else {
                    console.error("Set Destination button not found in popup DOM element.");
                }
            });

            // No longer clear searchInput here, as autofill might have populated it
            // searchInput.value = '';

        } else {
            alert('Place not found. Please try a different search term.');
        }
    });
}

// Add event listeners for search icon click and Enter key
searchIcon.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
        clearSuggestions(); // Also hide suggestions on Enter
    }
});

// --- Bottom Navigation Bar placeholder (no functionality in script.js for now) ---
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Example: alert(item.querySelector('span:last-child').textContent + ' clicked!');
        // Add specific logic for Explore, Saved, You, Contribute here.
    });
});
