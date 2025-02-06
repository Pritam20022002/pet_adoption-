window.onload = async function () {
    const userId = sessionStorage.getItem("userId");
    console.log("Fetching ads for user:", userId);

    if (!userId) {
        console.error("No user ID found in session storage!");
        return;
    }

    try {
        const response = await fetch(`https://petadopt-jv77.onrender.com/dashboard?user_id=${userId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const ads = await response.json();
        console.log("API Response:", ads);

        if (ads.length === 0) {
            document.getElementById("ads-container").innerHTML = "<p>No ads found.</p>";
            return;
        }

        displayAds(ads);
    } catch (error) {
        console.error("Error fetching ads:", error);
    }
};

function displayAds(ads) {
    const container = document.getElementById("ads-container");
    container.innerHTML = ""; // Clear previous ads
  
    ads.forEach(ad => {
        const adElement = document.createElement("div");
        adElement.classList.add("ad-item");
    
        adElement.innerHTML = `
            <div class="ad-details">
                <h3>${ad.pet_name}</h3>
                <p>Type: ${ad.pet_type}</p>
                <p>Location: ${ad.location}</p>
                <p>Contact: ${ad.contact_details}</p>
                <button onclick="deleteAd(${ad.id})">Remove AD</button>
            </div>
            <img src="https://petadopt-jv77.onrender.com/ads/${ad.id}/image" alt="Pet Image" class="ad-image">
        `;
    
        container.appendChild(adElement);
    });
    
    
  }
  


async function deleteAd(adId) {
    try {
        const response = await fetch(`https://petadopt-jv77.onrender.com/ads/${adId}`, {
            method: "DELETE"
        });

        if (response.ok) {
            console.log(`Ad ${adId} deleted successfully.`);
            window.location.reload(); // Refresh to update the ads list
        } else {
            console.error("Error deleting ad:", await response.json());
        }
    } catch (err) {
        console.error("An error occurred while deleting the ad:", err);
    }
}
document.getElementById("logout-btn").addEventListener("click", function () {
    sessionStorage.clear();  // Clears all session storage data
    window.location.href = "../index.html";  // Redirect to login page
});