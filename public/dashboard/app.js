const SPECIAL_USERS = {
    "samizaouiadz": true,
    "jordan_river13": true
};

let specialMemberTimer = null;
let lastSpecialMemberId = null;
let lastMemberId = null;

let mainEventTimer = null;
let lastMainEventId = null;


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


        /* ترتيب التكبيس */
        renderTappers(
            data.tappers || []
        );


        /* آخر الداخلين */
        renderLatestMember(
            data.members || []
        );


        /* الأشخاص المميزون */
        checkSpecialMembers(
            data
        );


        /* الهدايا + المتابعة + الاشتراك */
        checkMainEvents(
            data
        );

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
   MAIN EVENTS
   هدية + متابعة + اشتراك
========================================= */

function checkMainEvents(state) {

    if (
        !state ||
        !Array.isArray(state.events)
    ) {
        return;
    }


    /*
     * نبحث عن:
     *
     * gift
     * follow
     * subscribe
     */

    const events =
        state.events.filter(
            event =>
                event &&
                (
                    event.type === "gift" ||
                    event.type === "follow" ||
                    event.type === "subscribe"
                )
        );


    if (!events.length) {
        return;
    }


    /*
     * السيرفر يضع أحدث حدث
     * في بداية القائمة
     */

    const latestEvent =
        events[0];


    const eventId =
        latestEvent.id ||
        latestEvent.eventId ||
        `${latestEvent.type}-${latestEvent.username}-${latestEvent.time}`;


    /*
     * لا نعرض نفس الحدث مرة أخرى
     */

    if (
        eventId === lastMainEventId
    ) {
        return;
    }


    lastMainEventId =
        eventId;


    showMainEvent(
        latestEvent
    );
}


/* =========================================
   SHOW MAIN EVENT
========================================= */

function showMainEvent(data) {

    const event =
        document.getElementById(
            "mainEvent"
        );

    const avatar =
        document.getElementById(
            "eventAvatar"
        );

    const placeholder =
        document.getElementById(
            "eventAvatarPlaceholder"
        );

    const username =
        document.getElementById(
            "eventUsername"
        );

    const giftName =
        document.getElementById(
            "eventGiftName"
        );

    const giftCount =
        document.getElementById(
            "eventGiftCount"
        );

    const badge =
        event?.querySelector(
            ".event-badge"
        );


    if (!event) {
        return;
    }


    const userName =
        data.nickname ||
        data.username ||
        "مستخدم";


    username.textContent =
        userName;


    /* =====================================
       GIFT
    ===================================== */

    if (
        data.type === "gift"
    ) {

        badge.textContent =
            "🎁 هدية جديدة";


        giftName.textContent =
            data.giftName ||
            data.name ||
            "هدية";


        const count =
            Number(
                data.count ||
                data.repeatCount ||
                1
            );


        giftCount.textContent =
            count.toLocaleString();
    }


    /* =====================================
       FOLLOW
    ===================================== */

    else if (
        data.type === "follow"
    ) {

        badge.textContent =
            "🧡 متابعة جديدة";


        giftName.textContent =
            "تابعك الآن";


        giftCount.textContent =
            "";
    }


    /* =====================================
       SUBSCRIBE
    ===================================== */

    else if (
        data.type === "subscribe"
    ) {

        badge.textContent =
            "⭐ اشتراك جديد";


        giftName.textContent =
            "اشترك في اللايف";


        giftCount.textContent =
            "";
    }


    /* =====================================
       PROFILE PICTURE
    ===================================== */

    if (
        data.profilePicture
    ) {

        avatar.src =
            data.profilePicture;


        avatar.style.display =
            "block";


        placeholder.style.display =
            "none";


        avatar.onerror = () => {

            avatar.style.display =
                "none";

            placeholder.style.display =
                "flex";

        };

    } else {

        avatar.style.display =
            "none";

        placeholder.style.display =
            "flex";
    }


    /* =====================================
       SHOW ANIMATION
    ===================================== */

    event.classList.remove(
        "show"
    );


    void event.offsetWidth;


    event.classList.add(
        "show"
    );


    /* =====================================
       HIDE AFTER 5 SECONDS
    ===================================== */

    clearTimeout(
        mainEventTimer
    );


    mainEventTimer =
        setTimeout(
            () => {

                event.classList.remove(
                    "show"
                );

            },
            5000
        );
}


/* =========================================
   SPECIAL MEMBERS
========================================= */

function checkSpecialMembers(state) {

    if (
        !state ||
        !Array.isArray(state.events)
    ) {
        return;
    }


    const members =
        state.events.filter(
            event =>
                event &&
                (
                    event.type === "member" ||
                    event.type === "roomUser"
                )
        );


    if (!members.length) {
        return;
    }


    /*
     * أحدث شخص يدخل موجود في البداية
     */

    const member =
        members[0];


    const username =
        (
            member.username ||
            ""
        )
        .replace(
            /^@/,
            ""
        )
        .toLowerCase();


    /*
     * هل هو شخص مميز؟
     */

    if (
        !SPECIAL_USERS[username]
    ) {
        return;
    }


    const eventId =
        member.id ||
        `${username}-${member.time || ""}`;


    /*
     * لا نعيد نفس الحدث
     */

    if (
        eventId ===
        lastSpecialMemberId
    ) {
        return;
    }


    lastSpecialMemberId =
        eventId;


    showSpecialMember(
        member
    );
}


/* =========================================
   SHOW SPECIAL MEMBER
========================================= */

function showSpecialMember(member) {

    const container =
        document.getElementById(
            "specialMember"
        );


    const avatar =
        document.getElementById(
            "specialAvatar"
        );


    const placeholder =
        document.getElementById(
            "specialAvatarPlaceholder"
        );


    const username =
        document.getElementById(
            "specialUsername"
        );


    if (!container) {
        return;
    }


    const name =
        member.nickname ||
        member.username ||
        "مستخدم";


    username.textContent =
        name;


    /* =====================================
       PROFILE PICTURE
    ===================================== */

    if (
        member.profilePicture
    ) {

        avatar.src =
            member.profilePicture;


        avatar.style.display =
            "block";


        placeholder.style.display =
            "none";


        avatar.onerror = () => {

            avatar.style.display =
                "none";

            placeholder.style.display =
                "flex";

        };

    } else {

        avatar.style.display =
            "none";

        placeholder.style.display =
            "flex";
    }


    /* =====================================
       SHOW
    ===================================== */

    container.classList.remove(
        "show"
    );


    void container.offsetWidth;


    container.classList.add(
        "show"
    );


    /* =====================================
       HIDE AFTER 10 SECONDS
    ===================================== */

    clearTimeout(
        specialMemberTimer
    );


    specialMemberTimer =
        setTimeout(
            () => {

                container.classList.remove(
                    "show"
                );

            },
            10000
        );
}
