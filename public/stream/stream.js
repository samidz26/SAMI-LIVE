async function loadStreamStatus() {
    try {
        const response = await fetch("/api/status");
        const data = await response.json();

        const username = document.getElementById("streamUsername");
        const status = document.getElementById("streamStatus");
        const viewers = document.getElementById("streamViewers");
        const likes = document.getElementById("streamLikes");

        if (username) {
            username.textContent = data.username
                ? `@${data.username}`
                : "---";
        }

        if (status) {
            status.textContent = data.connected
                ? "متصل"
                : "غير متصل";
        }

        if (viewers) {
            viewers.textContent = Number(data.viewers || 0).toLocaleString();
        }

        if (likes) {
            likes.textContent = Number(data.likes || 0).toLocaleString();
        }

    } catch (error) {
        console.error("Stream status error:", error);
    }
}

loadStreamStatus();

setInterval(loadStreamStatus, 2000);
