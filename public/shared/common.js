function navigateTo(page) {
    window.location.href = page;
}

function setActiveNavigation() {
    const currentPath = window.location.pathname;

    document.querySelectorAll(".nav-button").forEach((button) => {
        const target = button.dataset.page;

        if (target && currentPath.includes(target)) {
            button.classList.add("active");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setActiveNavigation();
});
