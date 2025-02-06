document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const mobile_number = document.getElementById("mobile_number").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("https://petadopt-jv77.onrender.com/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mobile_number, password }),
        });

        const data = await response.json();

        if (response.ok) {
            sessionStorage.setItem("userId", data.userId); // Store user ID in sessionStorage
            window.location.href = "home/home.html"; // Redirect to home page
        } else {
            // Handle error response from server
            document.getElementById("error-message").innerText = data.message || "Login failed";
        }
    } catch (error) {
        // Handle network errors
        document.getElementById("error-message").innerText = "An error occurred. Please try again later.";
    }
});
