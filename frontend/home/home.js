document.getElementById("logout-btn").addEventListener("click", function () {
    sessionStorage.clear();  // Clears all session storage data
    window.location.href = "../index.html";  // Redirect to login page
});
