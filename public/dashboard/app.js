async function loadDashboard() {
    try {
        const response = await fetch("/api/status");

        if (!response.ok) {
            throw new Error("Failed to load status");
        }

        const data = await response.json();

        renderTappers(data.tappers || []);
        renderMembers(data.members || []);

    } catch (error) {
        console.error("Dashboard error:", error);
    }
}

/* =========================
   أفضل 3 مكبسين
========================= */

function renderTappers(tappers) {

    const container =
        document.getElementById("tappersList");

    if (!container) return;

    if (!tappers.length) {

        container.innerHTML = `
            <div class="no-data">
                بانتظار التكبيس...
            </div>
        `;

        return;
    }

    const topThree = tappers.slice(0, 3);

    container.innerHTML = topThree.map((user, index) => {

        const rank = index + 1;

        const avatar = user.profilePicture
            ? `
                <img
                    class="tapper-avatar"
                    src="${escapeHtml(user.profilePicture)}"
                    alt=""
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >

                <div
                    class="tapper-avatar-placeholder"
                    style="display:none;">
                    👤
                </div>
              `
            : `
                <div class="tapper-avatar-placeholder">
                    👤
                </div>
              `;

        return `
            <div class="tapper ${rank === 1 ? "first" : ""}">

                <div class="tapper-rank">
                    ${rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                </div>

                ${avatar}

                <div class="tapper-name">
                    ${escapeHtml(user.nickname || user.username)}
                </div>

                <div class="tapper-likes">
                    ${Number(user.likes || 0).toLocaleString()}
                </div>

            </div>
        `;

    }).join("");
}

/* =========================
   الداخلون
========================= */

function renderMembers(members) {

    const container =
        document.getElementById("membersList");

    if (!container) return;

    if (!members.length) {

        container.innerHTML = `
            <div class="no-data">
                بانتظار دخول المتابعين...
            </div>
        `;

        return;
    }

    container.innerHTML = members.map(user => {

        const avatar = user.profilePicture
            ? `
                <img
                    class="member-avatar"
                    src="${escapeHtml(user.profilePicture)}"
                    alt=""
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >

                <div
                    class="member-avatar-placeholder"
                    style="display:none;">
                    👤
                </div>
              `
            : `
                <div class="member-avatar-placeholder">
                    👤
                </div>
              `;

        const time = user.joinedAt
            ? formatTime(user.joinedAt)
            : "";

        return `
            <div class="member">

                ${avatar}

                <div class="member-info">

                    <div class="member-name">
                        ${escapeHtml(user.nickname || user.username)}
                    </div>

                    <div class="member-message">
                        مرحباً ${escapeHtml(user.nickname || user.username)} 👋
                    </div>

                </div>

                <div class="member-time">
                    ${time}
                </div>

            </div>
        `;

    }).join("");
}

/* =========================
   الوقت
========================= */

function formatTime(date) {

    try {

        return new Date(date).toLocaleTimeString(
            "ar-DZ",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    } catch {

        return "";
    }
}

/* =========================
   حماية HTML
========================= */

function escapeHtml(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================
   تحديث مباشر
========================= */

loadDashboard();

setInterval(loadDashboard, 1000);
