async function loadStatus() {
    try {
        const response = await fetch("/api/status");
        const data = await response.json();

        const status = document.getElementById("connectionStatus");

        if (!status) return;

        if (data.connected) {
            status.textContent = `متصل بـ @${data.username}`;
        } else {
            status.textContent = "غير متصل";
        }

    } catch (error) {
        console.error("Status error:", error);

        const status = document.getElementById("connectionStatus");

        if (status) {
            status.textContent = "تعذر الحصول على الحالة";
        }
    }
}

loadStatus();

setInterval(loadStatus, 2000);
