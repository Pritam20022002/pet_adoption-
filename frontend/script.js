document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form from reloading the page

    const mobile = document.getElementById("mobile").value;
    const password = document.getElementById("password").value;

    const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_number: mobile, password: password })
    });

    const data = await response.json();

    if (response.ok) {
        localStorage.setItem("user_id", data.userId); // Store user ID
        window.location.href = "dashboard.html"; // Redirect to dashboard
    } else {
        document.getElementById("error-message").textContent = data.message;
    }
});
