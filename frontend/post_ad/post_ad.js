document.getElementById("post-ad-form").addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent default form submission
    console.log("Form submitted!");
    // Get form values
    const pet_name = document.getElementById("pet_name").value;
    const pet_type = document.getElementById("pet_type").value;
    const location = document.getElementById("location").value;
    const contact_details = document.getElementById("contact_details").value;
    const imageFile = document.getElementById("image").files[0]; // Get the image file

    // Get user_id from session storage
    const user_id = sessionStorage.getItem("userId");

    if (!user_id) {
        console.error("User ID is missing from session storage.");
        return;
    }

    if (!imageFile) {
        console.error("Image file is required.");
        return;
    }

    // Create FormData to send the image file and other details
    const formData = new FormData();
    formData.append("pet_name", pet_name);
    formData.append("pet_type", pet_type);
    formData.append("location", location);
    formData.append("contact_details", contact_details);
    formData.append("image", imageFile); // Attach the file
    formData.append("user_id", user_id);

    try {
        const response = await fetch("http://localhost:5000/ads", {
            method: "POST",
            body: formData // No need to set headers manually with FormData
        });

        console.log("Raw response:", response); // ✅ Debugging

        // Ensure we wait for JSON response
        const data = await response.json();
        console.log("Parsed response data:", data); // ✅ Debugging
        if (response.ok) {
            alert("Ad posted successfully!"); // ✅ Show pop-up message
            window.location.href = "../dashboard/dashboard.html"; // ✅ Redirect to dashboard
        } else {
            console.error("Error posting ad:", data.error || "Unknown error");
        }
    } catch (err) {
        console.error("An error occurred while posting the ad:", err);
    }
});
