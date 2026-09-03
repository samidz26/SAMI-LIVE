let lastMemberId = null;


/* =========================================
   LOAD DASHBOARD
========================================= */

async function loadDashboard() {

    try {

        const response =
            await fetch("/api/status");

        if (!response.ok) {
            throw new Error("Failed to load status");
        }

        const data =
            await response.json();

        renderTappers(data.tappers || []);

        renderLatestMember(data.members || []);

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }
}


/* =========================================
   TAPPERS
========================================= */

function renderTappers(tappers) {

    const container =
        document.getElementById(
            "tappersList"
        );

    if (!container) return;


    if (!tappers.length) {

        container.innerHTML = `
            <div class="empty-state">
                بانتظار التكبيس...
            </div>
        `;

        return;
    }


    const topThree =
        tappers.slice(0, 3);


    container.innerHTML =
        topThree.map(
            (user, index) => {

                const rank =
                    index + 1;


                const avatar =
                    user.profilePicture

                    ? `
                        <img
                            class="tapper-avatar"
                            src="${escapeHtml(
                                user.profilePicture
                            )}"
                            alt=""
                            onerror="
                                this.style.display='none';
                                this.nextElementSibling.style.display='flex';
                            "
                        >

                        <div
                            class="tapper-avatar-placeholder"
                            style="display:none;">
                            👤
                        </div>
                    `

                    : `
                        <div
                            class="tapper-avatar-placeholder">
                            👤
                        </div>
                    `;


                return `

                    <div
                        class="tapper ${
                            rank === 1
                                ? "first"
                                : ""
                        }">

                        <div class="tapper-rank">

                            ${
                                rank === 1
                                    ? "🥇"
                                    : rank === 2
                                        ? "🥈"
                                        : "🥉"
                            }

                        </div>

                        ${avatar}

                        <div class="tapper-details">

                            <div
                                class="tapper-name">

                                ${escapeHtml(
                                    user.nickname ||
                                    user.username ||
                                    "مستخدم"
                                )}

                            </div>

                            <div
                                class="tapper-likes">

                                ❤️ ${
                                    Number(
                                        user.likes || 0
                                    ).toLocaleString()
                                }

                            </div>

                        </div>

                    </div>

                `;

            }
        ).join("");
}


/* =========================================
   LATEST MEMBER
========================================= */

function renderLatestMember(members) {

    const container =
        document.getElementById(
            "latestMember"
        );

    if (!container) return;


    if (!members.length) {

        container.innerHTML = `
            <div class="empty-member">

                <div class="empty-icon">
                    ♙
                </div>

                <div>
                    بانتظار دخول المتابعين...
                </div>

            </div>
        `;

        return;
    }


    /*
     * members are already stored
     * in latest-first order by server.
     */

    const user =
        members[0];


    const memberId =
        user.uniqueId ||
        user.userId ||
        user.username ||
        user.nickname;


    /*
     * إذا كان نفس الشخص ما زال ظاهرًا
     * لا نعيد تشغيل الحركة.
     */

    if (
        memberId === lastMemberId &&
        container.querySelector(".member-card")
    ) {
        return;
    }


    lastMemberId =
        memberId;


    const name =
        user.nickname ||
        user.username ||
        "مستخدم";


    const avatar =
        user.profilePicture

        ? `
            <img
                class="member-avatar"
                src="${escapeHtml(
                    user.profilePicture
                )}"
                alt=""
                onerror="
                    this.style.display='none';
                    this.nextElementSibling.style.display='flex';
                "
            >

            <div
                class="member-avatar-placeholder"
                style="display:none;">
                👤
            </div>
        `

        : `
            <div
                class="member-avatar-placeholder">
                👤
            </div>
        `;


    container.innerHTML = `

        <div class="member-card">

            ${avatar}

            <div class="member-name">

                ${escapeHtml(name)}

            </div>

            <div class="member-welcome">

                نورت اللايف ✨

            </div>

        </div>

    `;
}


/* =========================================
   SECURITY
========================================= */

function escapeHtml(value) {

    return String(value || "")

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================
   START
========================================= */

loadDashboard();

setInterval(
    loadDashboard,
    700
);
