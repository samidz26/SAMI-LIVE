const express = require("express");
const path = require("path");
const TikTokLiveConnector = require("tiktok-live-connector");

const WebcastPushConnection =
    TikTokLiveConnector.WebcastPushConnection ||
    TikTokLiveConnector.default ||
    TikTokLiveConnector;

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


/* =====================================================
   CONNECTION
===================================================== */

let connection = null;
let currentUsername = null;


/* =====================================================
   LIVE STATE
===================================================== */

const liveState = {

    username: null,

    connected: false,

    viewers: 0,

    likes: 0,

    comments: 0,

    follows: 0,

    gifts: 0,

    /* أفضل المكبسين */
    tappers: [],

    /* الداخلون */
    members: [],

    /* آخر الأحداث */
    events: []
};


/* =====================================================
   USER DATA HELPERS
===================================================== */

/*
 * TikTok Live Connector قد يعيد بيانات المستخدم
 * مباشرة داخل data أو داخل data.user.
 */

function getUserObject(data) {

    if (
        data &&
        data.user &&
        typeof data.user === "object"
    ) {
        return data.user;
    }

    return data || {};
}


function getUserName(data) {

    const user = getUserObject(data);

    return (
        user.uniqueId ||
        data?.uniqueId ||
        user.unique_id ||
        data?.unique_id ||
        user.userName ||
        data?.userName ||
        user.username ||
        data?.username ||
        "unknown"
    );
}


function getNickname(data) {

    const user = getUserObject(data);

    return (
        user.nickname ||
        data?.nickname ||
        user.displayName ||
        data?.displayName ||
        getUserName(data)
    );
}


function getProfilePicture(data) {

    const user = getUserObject(data);

    return (
        user.profilePictureUrl ||
        data?.profilePictureUrl ||
        user.profilePicture ||
        data?.profilePicture ||
        user.avatarLarger ||
        data?.avatarLarger ||
        user.avatarMedium ||
        data?.avatarMedium ||
        null
    );
}


function getUserId(data) {

    const user = getUserObject(data);

    return (
        user.userId ||
        data?.userId ||
        user.id ||
        data?.id ||
        null
    );
}


/* =====================================================
   EVENTS
===================================================== */

function addEvent(type, data, extra = {}) {

    liveState.events.unshift({

        id:
            Date.now() +
            Math.random(),

        type,

        username:
            getUserName(data),

        nickname:
            getNickname(data),

        profilePicture:
            getProfilePicture(data),

        time:
            new Date().toISOString(),

        ...extra
    });


    if (
        liveState.events.length >
        100
    ) {
        liveState.events.length = 100;
    }
}


/* =====================================================
   HOME
===================================================== */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


/* =====================================================
   STATUS API
===================================================== */

app.get("/api/status", (req, res) => {

    res.json({

        ...liveState,

        tappers:
            liveState.tappers
                .slice(0, 100),

        members:
            liveState.members
                .slice(0, 1000),

        events:
            liveState.events
                .slice(0, 100)

    });

});


/* =====================================================
   CONNECT API
===================================================== */

app.post(
    "/api/connect",
    async (req, res) => {

        const username =
            String(
                req.body.username || ""
            )
                .trim()
                .replace(/^@/, "");


        if (!username) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        "أدخل اسم مستخدم TikTok"

                });

        }


        /* =========================================
           DISCONNECT OLD CONNECTION
        ========================================= */

        if (connection) {

            try {

                await connection.disconnect();

            } catch (error) {

                console.log(
                    "Disconnect warning:",
                    error?.message ||
                    error
                );

            }

            connection = null;

        }


        currentUsername =
            username;


        /* =========================================
           RESET STATE
        ========================================= */

        liveState.username =
            username;

        liveState.connected =
            false;

        liveState.viewers =
            0;

        liveState.likes =
            0;

        liveState.comments =
            0;

        liveState.follows =
            0;

        liveState.gifts =
            0;

        liveState.tappers =
            [];

        liveState.members =
            [];

        liveState.events =
            [];


        console.log("");

        console.log(
            "================================="
        );

        console.log(
            `🔄 الاتصال بـ @${username}`
        );

        console.log(
            "================================="
        );


        try {

            /* =====================================
               CREATE CONNECTION
            ===================================== */

            connection =
                new WebcastPushConnection(
                    username
                );


            /* =====================================
               CONNECTED
            ===================================== */
connection.on("rawData", (data) => {
    console.log("🔥 RAW DATA RECEIVED");
});
            connection.on(
                "connected",
                (state) => {

                    liveState.connected =
                        true;

                    console.log("");

                    console.log(
                        `✅ Connected: @${username}`
                    );


                    if (
                        state?.roomId
                    ) {

                        console.log(
                            `Room ID: ${state.roomId}`
                        );

                    }

                }
            );


            /* =====================================
               WEBSOCKET CONNECTED
            ===================================== */

            connection.on(
                "websocketConnected",
                () => {

                    console.log(
                        "🔌 WebSocket connected"
                    );

                }
            );


            /* =====================================
               DISCONNECTED
            ===================================== */

            connection.on(
                "disconnected",
                (data) => {

                    liveState.connected =
                        false;

                    console.log(
                        "❌ TikTok disconnected",
                        data || ""
                    );

                }
            );


            /* =====================================
               STREAM END
            ===================================== */

            connection.on(
                "streamEnd",
                () => {

                    liveState.connected =
                        false;

                    console.log(
                        "🏁 TikTok LIVE انتهى"
                    );

                }
            );


            /* =====================================
               ERROR
            ===================================== */

            connection.on(
                "error",
                (error) => {

                    console.log(
                        "❌ TikTok Error:",
                        error?.message ||
                        error
                    );

                }
            );


            /* =====================================
               MEMBER
               دخول شخص إلى اللايف
            ===================================== */

            connection.on(
                "member",
                (data) => {

                    const username =
                        getUserName(data);

                    const nickname =
                        getNickname(data);

                    const profilePicture =
                        getProfilePicture(data);

                    const userId =
                        getUserId(data);


                    console.log("");

                    console.log(
                        `👤 دخل اللايف: @${username}`
                    );

                    console.log(
                        `   الاسم: ${nickname}`
                    );


                    /* =========================
                       البحث عن الشخص
                    ========================= */

                    const existing =
                        liveState.members.find(
                            user =>
                                user.username ===
                                username
                        );


                    /* =========================
                       شخص جديد
                    ========================= */

                    if (!existing) {

                        liveState.members.unshift({

                            username,

                            nickname,

                            profilePicture,

                            userId,

                            joinedAt:
                                new Date()
                                    .toISOString(),

                            joinCount: 1

                        });

                    }


                    /* =========================
                       شخص موجود
                    ========================= */

                    else {

                        existing.joinCount =
                            (
                                existing.joinCount ||
                                1
                            ) + 1;

                        existing.nickname =
                            nickname;

                        existing.profilePicture =
                            profilePicture;

                        existing.lastJoinedAt =
                            new Date()
                                .toISOString();

                        /*
                         * نعيده إلى الأعلى
                         * لأنه دخل مرة أخرى
                         */

                        liveState.members =
                            liveState.members.filter(
                                user =>
                                    user.username !==
                                    username
                            );

                        liveState.members.unshift(
                            existing
                        );

                    }


                    /* =========================
                       VIEWERS
                    ========================= */

                    if (
                        Number.isFinite(
                            Number(
                                data?.memberCount
                            )
                        )
                    ) {

                        liveState.viewers =
                            Number(
                                data.memberCount
                            );

                    }


                    /* =========================
                       LIMIT
                    ========================= */

                    if (
                        liveState.members.length >
                        1000
                    ) {

                        liveState.members.length =
                            1000;

                    }


                    /* =========================
                       EVENT
                    ========================= */

                    addEvent(
                        "member",
                        data
                    );

                }
            );


            /* =====================================
               ROOM USER
               عدد المشاهدين
            ===================================== */

            connection.on(
                "roomUser",
                (data) => {

                    const viewerCount =
                        Number(
                            data?.viewerCount ||
                            data?.userCount ||
                            data?.memberCount ||
                            0
                        );


                    if (
                        viewerCount >= 0
                    ) {

                        liveState.viewers =
                            viewerCount;

                    }


                    console.log(
                        `👁️ المشاهدون: ${liveState.viewers}`
                    );

                }
            );


            /* =====================================
               CHAT
            ===================================== */

            connection.on(
                "chat",
                (data) => {

                    const username =
                        getUserName(data);

                    const nickname =
                        getNickname(data);

                    const comment =
                        data?.comment ||
                        data?.content ||
                        "";


                    liveState.comments++;


                    console.log(
                        `💬 @${username}: ${comment}`
                    );


                    addEvent(
                        "chat",
                        data,
                        {
                            comment
                        }
                    );

                }
            );


            /* =====================================
               LIKE
               التكبيس
            ===================================== */

            connection.on(
                "like",
                (data) => {

                    const username =
                        getUserName(data);

                    const nickname =
                        getNickname(data);

                    const profilePicture =
                        getProfilePicture(data);


                    let count =
                        Number(
                            data?.likeCount ||
                            data?.count ||
                            1
                        );


                    if (
                        !Number.isFinite(count) ||
                        count < 1
                    ) {

                        count = 1;

                    }


                    /* =========================
                       TOTAL LIKES
                    ========================= */

                    liveState.likes +=
                        count;


                    console.log(
                        `❤️ @${username} ×${count}`
                    );


                    /* =========================
                       FIND TAPPER
                    ========================= */

                    let tapper =
                        liveState.tappers.find(
                            user =>
                                user.username ===
                                username
                        );


                    /* =========================
                       NEW TAPPER
                    ========================= */

                    if (!tapper) {

                        tapper = {

                            username,

                            nickname,

                            profilePicture,

                            likes: 0

                        };


                        liveState.tappers.push(
                            tapper
                        );

                    }


                    /* =========================
                       UPDATE USER DATA
                    ========================= */

                    tapper.nickname =
                        nickname;

                    tapper.profilePicture =
                        profilePicture;


                    /* =========================
                       ADD LIKES
                    ========================= */

                    tapper.likes +=
                        count;


                    /* =========================
                       SORT
                    ========================= */

                    liveState.tappers.sort(
                        (a, b) =>
                            b.likes -
                            a.likes
                    );


                    /* =========================
                       TOP 100
                    ========================= */

                    if (
                        liveState.tappers.length >
                        100
                    ) {

                        liveState.tappers.length =
                            100;

                    }


                    /* =========================
                       EVENT
                    ========================= */

                    addEvent(
                        "like",
                        data,
                        {
                            likeCount: count
                        }
                    );

                }
            );


            /* =====================================
               GIFT
            ===================================== */

            connection.on(
                "gift",
                (data) => {

                    const username =
                        getUserName(data);

                    const giftName =
                        data?.giftName ||
                        data?.gift?.name ||
                        "هدية";


                    liveState.gifts++;


                    console.log(
                        `🎁 @${username}: ${giftName}`
                    );


                    addEvent(
                        "gift",
                        data,
                        {
                            giftName
                        }
                    );

                }
            );


            /* =====================================
               FOLLOW
            ===================================== */

            connection.on(
                "follow",
                (data) => {

                    const username =
                        getUserName(data);


                    liveState.follows++;


                    console.log(
                        `➕ @${username} تابع البث`
                    );


                    addEvent(
                        "follow",
                        data
                    );

                }
            );


            /* =====================================
               SOCIAL
               بعض الإصدارات ترسل المتابعة هنا
            ===================================== */

            connection.on(
                "social",
                (data) => {

                    const action =
                        String(
                            data?.action ||
                            data?.displayType ||
                            data?.label ||
                            ""
                        )
                            .toLowerCase();


                    /*
                     * نعرض الحدث في السجل،
                     * لكن لا نزيد follows هنا
                     * لتجنب التكرار إذا كان
                     * follow event موجودًا.
                     */

                    console.log(
                        "📢 Social:",
                        getUserName(data),
                        action
                    );


                    addEvent(
                        "social",
                        data
                    );

                }
            );


            /* =====================================
               SUBSCRIBE
            ===================================== */

            connection.on(
                "subscribe",
                (data) => {

                    console.log(
                        `⭐ اشتراك: @${getUserName(data)}`
                    );


                    addEvent(
                        "subscribe",
                        data
                    );

                }
            );


            /* =====================================
               START CONNECTION
            ===================================== */

            await connection.connect();


            /* =====================================
               RESPONSE
            ===================================== */

            res.json({

                success: true,

                username,

                message:
                    "تم الاتصال باللايف"

            });

        }


        catch (error) {

            liveState.connected =
                false;

            connection =
                null;


            console.log("");

            console.log(
                "❌ فشل الاتصال:"
            );

            console.log(
                error?.message ||
                error
            );


            res
                .status(500)
                .json({

                    success: false,

                    message:
                        error?.message ||
                        "فشل الاتصال بـ TikTok"

                });

        }

    }
);


/* =====================================================
   SERVER
===================================================== */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "================================="
        );

        console.log(
            "          SAMI LIVE"
        );

        console.log(
            "================================="
        );

        console.log(
            `🚀 Server started on port ${PORT}`
        );

        console.log(
            "================================="
        );

    }
);
