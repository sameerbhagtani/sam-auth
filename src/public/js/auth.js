document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.querySelector('form[action="/auth/register"]');
    const loginForm = document.querySelector('form[action="/auth/login"]');

    if (registerForm) {
        registerForm.addEventListener("submit", handleFormSubmit);
    }

    if (loginForm) {
        loginForm.addEventListener("submit", handleFormSubmit);
    }
});

async function handleFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const action = form.getAttribute("action");

    try {
        const response = await fetch(action, {
            method: "POST",
            body: new URLSearchParams(formData),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        const data = await response.json();

        if (data.success) {
            // Redirect to the provided URL
            window.location.href = data.redirectUrl;
        } else {
            // Show error alert
            alert(data.message || "An error occurred. Please try again.");
        }
    } catch (error) {
        alert("Network error. Please try again.");
        console.error(error);
    }
}
