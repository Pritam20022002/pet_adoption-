document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const petType = urlParams.get("petType");

    if (!petType) {
        document.getElementById("page-title").textContent = "No pet type selected";
        return;
    }

    document.getElementById("page-title").textContent = `Available ${petType.charAt(0).toUpperCase() + petType.slice(1)}s`;

    try {
        const response = await fetch(`http://localhost:5000/ads?petType=${petType}`);
        const ads = await response.json();

        const adsContainer = document.getElementById("ads-container");
        adsContainer.innerHTML = ""; // Clear existing content

        if (ads.length === 0) {
            adsContainer.innerHTML = "<p>No ads found for this category.</p>";
            return;
        }

        ads.forEach(ad => {
            const adElement = document.createElement("div");
            adElement.classList.add("ad");

            adElement.innerHTML = `
                <h2>${ad.pet_name}</h2>
                <p>Location: ${ad.location}</p>
                <p>Contact: ${ad.contact_details}</p>
                <img src="http://localhost:5000/ads/${ad.id}/image" alt="${ad.pet_name}">
            `;

            adsContainer.appendChild(adElement);
        });
    } catch (error) {
        console.error("Error fetching ads:", error);
        document.getElementById("ads-container").innerHTML = "<p>Failed to load ads. Please try again later.</p>";
    }
});
