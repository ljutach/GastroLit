function switchTheme(themePath) {
    currentTheme = themePath;
    document.getElementById('theme-stylesheet').setAttribute('href', themePath);
    localStorage.setItem("selectedTheme", themePath); // Save theme to localStorage

    // Cambia l'immagine del logo in base al tema selezionato
    let logoImage = document.getElementById('logo-image');
    if (logoImage) {
        if (themePath.includes("middleage")) {
            logoImage.src = "images/logo.jpeg";
        } else if (themePath.includes("cyberpunk")) {
            logoImage.src = "images/logo_cyberpunk.jpeg";
        } else if (themePath.includes("futuristic")) {
            logoImage.src = "images/futuristic.png";
        }
    }

    setTimeout(() => {
        restoreDropdownListeners();
        initializePopups(); // Ensure popups work with Cyberpunk
        console.log("✅ Popups and dropdowns restored after theme switch");
    }, 500);
}


// Function to update the dropdown based on the current theme
function updateThemeDropdown() {
    const themeSelector = document.getElementById("theme-selector");
    themeSelector.value = currentTheme;
}


// Apply saved theme on page load
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('theme-stylesheet').setAttribute('href', currentTheme);
    updateThemeDropdown(); // Update dropdown to reflect the current theme
});

function reloadWithTheme() {
    window.location.href = "index.html"; // Reload page
    setTimeout(() => {
        document.getElementById('theme-stylesheet').setAttribute('href', localStorage.getItem("selectedTheme"));
    }, 200);
}


// Apply saved theme on page load
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('theme-stylesheet').setAttribute('href', currentTheme);
});


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
}




function loadAuthorContent(authorPath, author, region) {
    $("#author-content").load(authorPath, function () {
        document.getElementById('theme-stylesheet').setAttribute('href', currentTheme);
        document.getElementById("author-content").setAttribute("data-author", author);
        document.getElementById("author-content").setAttribute("data-region", region);
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

