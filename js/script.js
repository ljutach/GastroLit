// JS set of functions for dynamic content loading


let currentTheme = localStorage.getItem("selectedTheme");

if (!currentTheme) {
    currentTheme = 'styles/middleage.css'; // Force default theme
    localStorage.setItem("selectedTheme", currentTheme); // Save default to localStorage
}


// Switch themes and store in localStorage
function switchTheme(themePath) {
    currentTheme = themePath;
    document.getElementById('theme-stylesheet').setAttribute('href', themePath);
    localStorage.setItem("selectedTheme", themePath);

    // Scroll to the top when switching themes
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Update the dropdown
    const themeSelector = document.getElementById("theme-selector");
    themeSelector.value = themePath;

    // Change the logo based on the theme
    let logoImage = document.getElementById('logo-image');
    if (logoImage) {
        if (themePath.includes("middleage")) {
            logoImage.src = "images/logo_middleage1.svg";
        } else if (themePath.includes("futurism")) {
            logoImage.src = "images/logo_futurism.jpg";
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

// Update the dropdown based on the current theme

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
            logoImage.src = "images/logo_middleage1.svg";
        } else if (currentTheme.includes("futurism")) {
            logoImage.src = "images/logo_futurism.jpg";
        } else if (currentTheme.includes("cyberpunk")) {
            logoImage.src = "images/logo_cyberpunk.png";
        } else if (currentTheme.includes("futuristic")) {
            logoImage.src = "images/logo_f  uturistic.png";
        }
    }
});


// Resets the homepage while maintaining the selected theme.

function reloadWithTheme() {
    let contentContainer = document.getElementById("doc-content");

    // Remove documentation content when reloading homepage
    contentContainer.innerHTML = "";

    window.location.href = "index.html";
    setTimeout(() => {
        const savedTheme = localStorage.getItem("selectedTheme") || 'styles/middleage.css';
        document.getElementById('theme-stylesheet').setAttribute('href', savedTheme);

        // Hide unrelevant sections
        document.getElementById("global-map-container").style.display = "block";
        document.getElementById("map-filter-container").style.display = "block";
        document.getElementById("author-content").style.display = "block";
        document.querySelector(".proj-container").style.display = "block";

        window.scrollTo({ top: 0, behavior: "smooth" });
    }, 200);
}


// Adds hover and click behaviors to dropdown menus.
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


// Handles dynamic content loading for authors.

function loadAuthorContent(authorPath, author, region) {
    let contentContainer = document.getElementById("doc-content");

    // Remove any previous content in the dynamic container
    contentContainer.innerHTML = "";

    $("#author-content").load(authorPath, function () {
        document.getElementById("theme-stylesheet").setAttribute("href", currentTheme);
        document.getElementById("author-content").setAttribute("data-author", author);
        document.getElementById("author-content").setAttribute("data-region", region);

        // Force-hide the unwanted elements
        document.querySelector(".title").style.display = "none";
        document.getElementById("doc-content").style.display = "none";
        document.querySelector(".proj-container").style.display = "none";
        document.getElementById("map-filter-container").style.display = "none";
        document.getElementById("global-map-container").style.display = "none";

        initializeMap();
        populateEntityTable();
        loadDescriptions().then(() => {
            initializePopups();
        });

        console.log(`📚 Loaded author: ${author}, UI elements hidden.`);
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
            const name = el.dataset.name; // Get only the data-name
            if (coord && name) {
                const [lat, lng] = coord.split(',').map(Number);
                L.marker([lat, lng]).addTo(map).bindPopup(`<strong>${name}</strong>`); // Display only data-name
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

    
    popup.style.zIndex = "5000"; 
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
let allPlaces = []; 
let markers = []; 

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

// Update the map based on the selected author

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
    }

    // Ensure everything reappears when returning to the home page
    document.querySelector(".navbar-brand").addEventListener("click", function () {
        globalMapContainer.style.display = "block"; 
        mapFilterContainer.style.display = "block";
        projectContainer.style.display = "block"; 
        applyMapTheme();
    });
});

// Dinamically load author-content

function loadAuthorContent(authorPath, author, region) {
    let contentContainer = document.getElementById("doc-content");

    // ✅ Clear previous documentation when switching to an author
    contentContainer.innerHTML = "";
    document.getElementById("author-content").style.display = "block"; // Show author content

    $("#author-content").load(authorPath, function () {
        document.getElementById("theme-stylesheet").setAttribute("href", currentTheme);
        document.getElementById("author-content").setAttribute("data-author", author);
        document.getElementById("author-content").setAttribute("data-region", region);

        // Hide everything unrelated to authors
        document.querySelector(".title").style.display = "none";
        document.getElementById("doc-content").style.display = "none";
        document.querySelector(".proj-container").style.display = "none";
        document.getElementById("map-filter-container").style.display = "none";
        document.getElementById("global-map-container").style.display = "none";

        setTimeout(() => {
            const contentContainer = document.getElementById("author-content"); 
            const offset = 145; 
            const yPosition = contentContainer.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: yPosition, behavior: "smooth" });
        }, 300);

        initializeMap();
        populateEntityTable();
        loadDescriptions().then(() => {
            initializePopups();
        });

        console.log(`📚 Loaded author: ${author}, UI elements hidden.`);
    });
}


// Dinamically load documentation

function loadDocumentation() {
    fetch('doc.html')
    .then(response => response.text())
    .then(data => {
        let contentContainer = document.getElementById("doc-content");
        contentContainer.innerHTML = data;
        contentContainer.style.display = "block"; 

        // Hide everything unrelated to documentation
        document.getElementById("author-content").style.display = "none"; 
        document.getElementById("global-map-container").style.display = "none";
        document.getElementById("map-filter-container").style.display = "none";
        document.querySelector(".proj-container").style.display = "none";

        
        let currentTheme = localStorage.getItem("selectedTheme") || "styles/middleage.css";
        document.getElementById("theme-stylesheet").setAttribute("href", currentTheme);

        console.log("📄 Documentation loaded successfully, everything else hidden.");

        setTimeout(() => {
            const contentContainer = document.getElementById("doc-content");
            const offset = 145; 
            const yPosition = contentContainer.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: yPosition, behavior: "smooth" });
        }, 300);
        
    })
    .catch(error => console.error("❌ Error loading documentation:", error));
}



// Restore author selection after doc.html is loaded
function restoreAuthorSelection() {
    document.querySelectorAll(".dropdown-menu a").forEach(item => {
        item.addEventListener("click", function (event) {
            event.preventDefault();

            let authorPath = this.getAttribute("onclick").match(/'([^']+)'/)[1]; // Extract path
            let author = this.getAttribute("onclick").match(/'([^']+)'/g)[1].replace(/'/g, ""); // Extract author
            let region = this.getAttribute("onclick").match(/'([^']+)'/g)[2].replace(/'/g, ""); // Extract region

            loadAuthorContent(authorPath, author, region);
            
        });
    });

    console.log("✅ Author selection restored.");
}



// Apply the current theme when the page loads
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("theme-stylesheet").setAttribute(
        "href",
        localStorage.getItem("selectedTheme") || "styles/middleage.css"
    );
});


function returnToHome() {
    window.location.href = "index.html";
    setTimeout(() => {
        document.getElementById("global-map-container").style.display = "block";
        document.getElementById("map-filter-container").style.display = "block";
        document.getElementById("author-content").style.display = "block";
        document.getElementById("doc-content").style.display = "block";
        document.querySelector(".proj-container").style.display = "block";

        console.log("🏠 Returned to home, all sections restored.");
    }, 200);
}
