let currentTheme = localStorage.getItem("selectedTheme");

if (!currentTheme) {
    currentTheme = 'styles/middleage.css'; // Force default theme
    localStorage.setItem("selectedTheme", currentTheme); // Save default to localStorage
}


// Function to switch themes and store in localStorage
function switchTheme(themePath) {
    currentTheme = themePath;
    document.getElementById('theme-stylesheet').setAttribute('href', themePath);
    localStorage.setItem("selectedTheme", themePath);

    // Update the dropdown
    const themeSelector = document.getElementById("theme-selector");
    themeSelector.value = themePath;

    // Change the logo based on the theme
    let logoImage = document.getElementById('logo-image');
    if (logoImage) {
        if (themePath.includes("middleage")) {
            logoImage.src = "images/logo_middleage.jpeg";
        } else if (themePath.includes("cyberpunk")) {
            logoImage.src = "images/logo_cyberpunk.png";
        } else if (themePath.includes("futuristic")) {
            logoImage.src = "images/logo_futuristic.png";
        }
    }

    setTimeout(() => {
        restoreDropdownListeners();
        initializePopups();
        console.log("✅ Popups and dropdowns restored after theme switch");
    }, 500);
}

// Function to update the dropdown based on the current theme
function updateThemeDropdown() {
    const themeSelector = document.getElementById("theme-selector");
    themeSelector.value = localStorage.getItem("selectedTheme") || 'styles/middleage.css';
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('theme-stylesheet').setAttribute('href', currentTheme);
    updateThemeDropdown(); // Ensure the dropdown is correct

    // Ensure logo updates correctly on page load
    let logoImage = document.getElementById('logo-image');
    if (logoImage) {
        if (currentTheme.includes("middleage")) {
            logoImage.src = "images/logo_middleage.jpeg";
        } else if (currentTheme.includes("cyberpunk")) {
            logoImage.src = "images/logo_cyberpunk.png";
        } else if (currentTheme.includes("futuristic")) {
            logoImage.src = "images/logo_futuristic.png";
        }
    }
});


function reloadWithTheme() {
    window.location.href = "index.html";
    setTimeout(() => {
        const savedTheme = localStorage.getItem("selectedTheme") || 'styles/middleage.css';
        document.getElementById('theme-stylesheet').setAttribute('href', savedTheme);

        // Ensure logo is also updated correctly
        let logoImage = document.getElementById('logo-image');
        if (logoImage) {
            if (savedTheme.includes("middleage")) {
                logoImage.src = "images/logo_middleage.jpeg";
            } else if (savedTheme.includes("cyberpunk")) {
                logoImage.src = "images/logo_cyberpunk.png";
            } else if (savedTheme.includes("futuristic")) {
                logoImage.src = "images/logo_futuristic.png";
            }
        }

        // Show the global map again when returning to homepage
        document.getElementById("global-map-container").style.display = "block";
    }, 200);
}



// Restore dropdown listeners for hover
function restoreDropdownListeners() {
    $(".dropdown").hover(function () {
        $(this).find(".dropdown-menu").first().stop(true, true).fadeIn(200);
    }, function () {
        $(this).find(".dropdown-menu").first().stop(true, true).fadeOut(200);
    });

    $(".dropdown-submenu").hover(function () {
        $(this).find(".dropdown-menu").first().stop(true, true).fadeIn(200);
    }, function () {
        $(this).find(".dropdown-menu").first().stop(true, true).fadeOut(200);
    });

    // Aggiungi gestione per submenu su click
    $(".dropdown-submenu a").on("click", function (e) {
        var submenu = $(this).next(".dropdown-menu");
        submenu.toggle(); // Mostra/Nasconde il submenu
        e.stopPropagation(); // Evita la chiusura del menu principale
        e.preventDefault(); // Previene il comportamento predefinito del link
    });
}


function loadAuthorContent(authorPath, author, region) {
    $("#author-content").load(authorPath, function () {
        document.getElementById("theme-stylesheet").setAttribute("href", currentTheme);
        document.getElementById("author-content").setAttribute("data-author", author);
        document.getElementById("author-content").setAttribute("data-region", region);

        // Hide the global map and filter when an author's page is loaded
        document.getElementById("global-map-container").style.display = "none";
        document.getElementById("map-filter-container").style.display = "none";

        initializeMap();
        populateEntityTable();
        loadDescriptions().then(() => {
            initializePopups();
        });
    });
}


function initializeMap() {
    const mapElement = document.getElementById("map");
    if (mapElement) {
        const map = L.map("map").setView([43.7696, 11.2558], 6);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        document.querySelectorAll(".tag.place").forEach(el => {
            const coord = el.dataset.coord;
            const name = el.dataset.name || el.innerText.trim();
            if (coord) {
                const [lat, lng] = coord.split(',').map(Number);
                L.marker([lat, lng]).addTo(map).bindPopup(`<strong>${name}</strong><br>${el.innerText}`);
            }
        });
    }
}



function populateEntityTable() {
    const tbody = document.querySelector("#entity-table tbody");
    tbody.innerHTML = "";

    const entities = {
        dish: document.querySelectorAll(".tag.dish"),
        place: document.querySelectorAll(".tag.place"),
        character: document.querySelectorAll(".tag.character")
    };

    const maxRows = Math.max(entities.dish.length, entities.place.length, entities.character.length);

    for (let i = 0; i < maxRows; i++) {
        const row = document.createElement("tr");

        ["dish", "place", "character"].forEach(type => {
            const cell = document.createElement("td");

            if (entities[type][i]) {
                const entity = entities[type][i];
                const entityName = entity.getAttribute("data-name") || entity.innerText; // Use data-name if available
                const entityId = entity.id; // Get the unique ID

                cell.innerHTML = `<a href="#" data-id="${entityId}" class="scroll-to">${entityName}</a>`;
                entity.classList.add("underline-highlight");
            }

            row.appendChild(cell);
        });

        tbody.appendChild(row);
    }

    document.querySelectorAll(".scroll-to").forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const target = document.getElementById(this.dataset.id);
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "center" });
                target.classList.add("temporary-highlight");
                setTimeout(() => target.classList.remove("temporary-highlight"), 4000);
            }
        });
    });
}


let descriptions = {};

async function loadDescriptions() {
    const authorContent = document.getElementById("author-content");
    if (!authorContent) return;

    const author = authorContent.dataset.author;
    const region = authorContent.dataset.region;
    if (!author || !region) return;

    const jsonPath = `issues/${region}/authors/${author}/descriptions.json`;
    try {
        const response = await fetch(jsonPath);
        if (!response.ok) throw new Error(`Failed to load JSON: ${jsonPath}`);
        descriptions = await response.json();
        console.log("✅ Descriptions loaded:", descriptions);
        initializePopups();
    } catch (error) {
        console.error("❌ JSON Load Error:", error);
    }
}

function initializePopups() {
    document.querySelectorAll(".tag").forEach(el => {
        el.addEventListener("click", event => {
            event.preventDefault();
            createPopup(el);
        });
    });
}


function createPopup(element) {
    const entityId = element.id;
    console.log("📌 Popup for:", entityId);
    
    const description = descriptions[entityId]?.description || "No description available.";
    const imageSrc = descriptions[entityId]?.image || null; // Check if an image is available
    const wikiLink = element.getAttribute("data-wiki"); // Get the Wikipedia link if available

    // Remove any existing popup
    document.querySelector(".popup-window")?.remove();

    // Create the popup window
    const popup = document.createElement("div");
    popup.classList.add("popup-window");

    // Add content dynamically, checking for an image
    popup.innerHTML = `
        <div class="popup-content">
            ${imageSrc ? `<img src="${imageSrc}" alt="Popup Image" class="popup-image">` : ""}
            <p class="popup-text">${description}</p>
        </div>
        ${wikiLink ? `<a href="${wikiLink}" target="_blank" class="read-more-btn">Read More</a>` : ""}
        <button class="close-btn">CLOSE</button>
    `;
    document.body.appendChild(popup);

    // Position the popup
    const rect = element.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();

    let top = window.scrollY + rect.bottom + 10;
    let left = window.scrollX + rect.left;

    if (top + popupRect.height > window.innerHeight + window.scrollY) {
        top = window.scrollY + rect.top - popupRect.height - 10;
    }
    if (left + popupRect.width > window.innerWidth + window.scrollX) {
        left = window.innerWidth + window.scrollX - popupRect.width - 10;
    }

    // Style the popup
    popup.style.zIndex = "5000"; // Ensure it's above everything
    popup.style.position = "absolute";
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    popup.style.background = "white";
    popup.style.border = "2px solid black";
    popup.style.padding = "15px";

    // Add event listener to close button
    popup.querySelector(".close-btn").addEventListener("click", () => popup.remove());
}



document.addEventListener("DOMContentLoaded", () => {
    restoreDropdownListeners();
});



let globalMap;
let allPlaces = []; // Store all places with author info
let markers = []; // Store markers for filtering

async function loadGlobalMap() {
    const mapElement = document.getElementById("global-map");
    if (!mapElement) return;

    // Initialize Leaflet map
    globalMap = L.map("global-map").setView([43.7696, 11.2558], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(globalMap);

    const authors = [
        { name: "dante", region: "tuscany" },
        { name: "boccaccio", region: "tuscany" },
        { name: "sacchetti", region: "tuscany" },
        { name: "camilleri", region: "sicily" },
        { name: "tomasi", region: "sicily" },
        { name: "torregrossa", region: "sicily" }
    ];

    // Fetch and store all places
    for (const author of authors) {
        const response = await fetch(`issues/${author.region}/authors/${author.name}/${author.name}.html`);
        if (!response.ok) continue;

        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        doc.querySelectorAll(".tag.place").forEach(el => {
            const coord = el.dataset.coord;
            const name = el.dataset.name || el.innerText.trim();
            if (coord) {
                const [lat, lng] = coord.split(',').map(Number);
                allPlaces.push({ lat, lng, name, author: author.name });
            }
        });
    }

    // Display all places by default
    updateMapByAuthor();
    console.log("✅ Global map loaded with places:", allPlaces);
}

// Function to update the map based on the selected author
function updateMapByAuthor() {
    const selectedAuthor = document.getElementById("map-author-filter").value;

    // Clear existing markers
    markers.forEach(marker => globalMap.removeLayer(marker));
    markers = [];

    // Filter places by author
    const filteredPlaces = selectedAuthor === "all"
        ? allPlaces
        : allPlaces.filter(place => place.author === selectedAuthor);

    // Add filtered markers to the map
    filteredPlaces.forEach(place => {
        const marker = L.marker([place.lat, place.lng]).addTo(globalMap)
            .bindPopup(`<strong>${place.name}</strong><br><em>${place.author}</em>`);
        markers.push(marker);
    });
}

// Load the map when the page loads
document.addEventListener("DOMContentLoaded", loadGlobalMap);

function applyMapTheme() {
    let theme = localStorage.getItem("selectedTheme");

    if (theme.includes("middleage")) {
        document.querySelector(".global-map-container").classList.add("middleage-map");
        document.querySelector(".author-map-container").classList.add("middleage-map");
        document.querySelector(".global-map-container").classList.remove("cyberpunk-map");
        document.querySelector(".author-map-container").classList.remove("cyberpunk-map");
    } else if (theme.includes("cyberpunk")) {
        document.querySelector(".global-map-container").classList.add("cyberpunk-map");
        document.querySelector(".author-map-container").classList.add("cyberpunk-map");
        document.querySelector(".global-map-container").classList.remove("middleage-map");
        document.querySelector(".author-map-container").classList.remove("middleage-map");
    }
}




document.addEventListener("DOMContentLoaded", () => {
    let authorContent = document.getElementById("author-content");
    let globalMapContainer = document.getElementById("global-map-container");
    let mapFilterContainer = document.getElementById("map-filter-container");
    let projectContainer = document.querySelector(".proj-container");

    if (authorContent && authorContent.getAttribute("data-author")) {
        globalMapContainer.style.display = "none"; // Hide the map
        mapFilterContainer.style.display = "none"; // Hide the filter dropdown
        projectContainer.style.display = "none"; // Hide the project description
    } else {
        globalMapContainer.style.display = "block"; // Show the map
        mapFilterContainer.style.display = "block"; // Show the filter dropdown
        projectContainer.style.display = "block"; // Show the project description
        applyMapTheme(); // Apply theme only if the map is visible
    }

    // Ensure everything reappears when returning to the home page
    document.querySelector(".navbar-brand").addEventListener("click", function () {
        globalMapContainer.style.display = "block"; 
        mapFilterContainer.style.display = "block";
        projectContainer.style.display = "block"; // Show the project description
        applyMapTheme();
    });
});


function loadAuthorContent(authorPath, author, region) {
    $("#author-content").load(authorPath, function () {
        document.getElementById("theme-stylesheet").setAttribute("href", currentTheme);
        document.getElementById("author-content").setAttribute("data-author", author);
        document.getElementById("author-content").setAttribute("data-region", region);

        // Hide the global map and filter when an author's page is loaded
        document.getElementById("global-map-container").style.display = "none";
        document.getElementById("map-filter-container").style.display = "none";
        
        // Hide the project description when an author page is loaded
        document.querySelector(".proj-container").style.display = "none";

        initializeMap();
        populateEntityTable();
        loadDescriptions().then(() => {
            initializePopups();
        });
    });
}

