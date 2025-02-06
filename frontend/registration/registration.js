document.getElementById("register-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const mobile_number = document.getElementById("mobile_number").value;
    const password = document.getElementById("password").value;

    const response = await fetch("https://petadopt-jv77.onrender.com/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile_number, password }),
    });

    const data = await response.json();

    if (response.ok) {
        window.location.href = "../index.html"; // Redirect to login page after successful registration
    } else {
        document.getElementById("error-message").innerText = data.message || "Registration failed";
    }
});
