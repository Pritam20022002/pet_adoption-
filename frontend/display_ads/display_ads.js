document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const petType = urlParams.get("petType");

    if (!petType) {
        document.getElementById("page-title").textContent = "No pet type selected";
        return;
    }

    document.getElementById("page-title").textContent = `Available ads for ${petType.charAt(0).toUpperCase() + petType.slice(1)} adoption`;

    try {
        const response = await fetch(`http://localhost:5000/ads?petType=${petType}`);
        const ads = await response.json();

        const adsContainer = document.getElementById("ads-container");
        adsContainer.innerHTML = ""; // Clear existing content

        if (ads.length === 0) {
            adsContainer.innerHTML = "<p>No ads available for this category.</p>";
            return;
        }

        ads.forEach(ad => {
            const adElement = document.createElement("div");
            adElement.classList.add("ad");

            adElement.innerHTML = `
            <div class="ad-details">
                <h2>${ad.pet_name}</h2>
                <p><strong>Location:</strong><br> ${ad.location}</p>
                <p><strong>Contact:</strong> ${ad.contact_details}</p>
            </div>
            <div class="ad-image">
                <img src="http://localhost:5000/ads/${ad.id}/image" alt="${ad.pet_name}">
            </div>
        `;

            adsContainer.appendChild(adElement);
        });
    } catch (error) {
        console.error("Error fetching ads:", error);
        document.getElementById("ads-container").innerHTML = "<p>Failed to load ads. Please try again later.</p>";
    }
});
document.getElementById("logout-btn").addEventListener("click", function () {
    sessionStorage.clear();  // Clears all session storage data
    window.location.href = "../index.html";  // Redirect to login page
});