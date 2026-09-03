const SPECIAL_USERS = {
    "samizaouiadz": true,
    "jordan_river13": true
};

let specialMemberTimer = null;
let lastSpecialMemberId = null;
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
        checkSpecialMembers(data);
        checkGiftEvents(data);
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
/* =========================================
   SAMI LIVE - MAIN GIFT EVENT
   ========================================= */

let giftEventTimer = null;
let lastGiftEventId = null;

function showGiftEvent(gift) {
    const event = document.getElementById("mainEvent");
    const avatar = document.getElementById("eventAvatar");
    const placeholder = document.getElementById("eventAvatarPlaceholder");
    const username = document.getElementById("eventUsername");
    const giftName = document.getElementById("eventGiftName");
    const giftCount = document.getElementById("eventGiftCount");

    if (!event) return;

    const userName =
        gift.nickname ||
        gift.username ||
        "مستخدم";

    const giftTitle =
        gift.giftName ||
        gift.name ||
        "هدية";

    const count =
        Number(gift.count || gift.repeatCount || 1);

    username.textContent = userName;
    giftName.textContent = giftTitle;
    giftCount.textContent = count.toLocaleString();

    if (gift.profilePicture) {
        avatar.src = gift.profilePicture;
        avatar.style.display = "block";
        placeholder.style.display = "none";

        avatar.onerror = () => {
            avatar.style.display = "none";
            placeholder.style.display = "flex";
        };
    } else {
        avatar.style.display = "none";
        placeholder.style.display = "flex";
    }

    /* إعادة تشغيل الحركة */
    event.classList.remove("show");

    void event.offsetWidth;

    event.classList.add("show");

    clearTimeout(giftEventTimer);

    giftEventTimer = setTimeout(() => {
        event.classList.remove("show");
    }, 5000);
}


/* =========================================
   مراقبة أحداث الهدايا
   ========================================= */

function checkGiftEvents(state) {

    if (!state || !Array.isArray(state.events)) return;

    const gifts = state.events.filter(
        event => event && (
            event.type === "gift" ||
            event.eventType === "gift"
        )
    );

    if (!gifts.length) return;

    const gift = gifts[gifts.length - 1];

    const eventId =
        gift.id ||
        gift.eventId ||
        `${gift.username || gift.nickname}-${gift.giftName || gift.name}-${gift.timestamp || ""}`;

    if (eventId === lastGiftEventId) return;

    lastGiftEventId = eventId;

    showGiftEvent(gift);
}
function checkSpecialMembers(state) {

    if (!state || !Array.isArray(state.events)) return;

    const members = state.events.filter(event =>
        event &&
        (
            event.type === "member" ||
            event.type === "roomUser"
        )
    );

    if (!members.length) return;

    const member = members[0];

    const username = (
        member.username ||
        ""
    ).replace(/^@/, "").toLowerCase();

    if (!SPECIAL_USERS[username]) return;

    const eventId =
        member.id ||
        `${username}-${member.time || ""}`;

    if (eventId === lastSpecialMemberId) return;

    lastSpecialMemberId = eventId;

    showSpecialMember(member);
}


function showSpecialMember(member) {

    const container =
        document.getElementById("specialMember");

    const avatar =
        document.getElementById("specialAvatar");

    const placeholder =
        document.getElementById("specialAvatarPlaceholder");

    const username =
        document.getElementById("specialUsername");

    if (!container) return;

    const name =
        member.nickname ||
        member.username ||
        "مستخدم";

    username.textContent = name;

    if (member.profilePicture) {

        avatar.src = member.profilePicture;

        avatar.style.display = "block";
        placeholder.style.display = "none";

        avatar.onerror = () => {

            avatar.style.display = "none";
            placeholder.style.display = "flex";

        };

    } else {

        avatar.style.display = "none";
        placeholder.style.display = "flex";

    }

    container.classList.remove("show");

    void container.offsetWidth;

    container.classList.add("show");

    clearTimeout(specialMemberTimer);

    specialMemberTimer = setTimeout(() => {

        container.classList.remove("show");

    }, 6000);
}
