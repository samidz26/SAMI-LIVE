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
app.use(express.static(path.join(__dirname, "public")));

let connection = null;
let currentUsername = null;

/* =========================
   حالة البث
========================= */

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

    /* آخر التفاعلات */
    events: []
};

/* =========================
   أدوات مساعدة
========================= */

function getUserName(data) {
    return (
        data?.uniqueId ||
        data?.user?.uniqueId ||
        data?.nickname ||
        data?.user?.nickname ||
        "unknown"
    );
}

function getNickname(data) {
    return (
        data?.nickname ||
        data?.user?.nickname ||
        getUserName(data)
    );
}

function getProfilePicture(data) {
    return (
        data?.profilePictureUrl ||
        data?.user?.profilePictureUrl ||
        data?.profilePicture ||
        null
    );
}

function addEvent(type, data) {
    liveState.events.unshift({
        id: Date.now() + Math.random(),
        type,
        username: getUserName(data),
        nickname: getNickname(data),
        profilePicture: getProfilePicture(data),
        time: new Date().toISOString()
    });

    /* الاحتفاظ بآخر 100 حدث فقط */
    if (liveState.events.length > 100) {
        liveState.events.length = 100;
    }
}

/* =========================
   الصفحة الرئيسية
========================= */

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

/* =========================
   حالة البث
========================= */

app.get("/api/status", (req, res) => {
    res.json(liveState);
});

/* =========================
   الاتصال بـ TikTok
========================= */

app.post("/api/connect", async (req, res) => {

    const username = String(req.body.username || "")
        .trim()
        .replace(/^@/, "");

    if (!username) {
        return res.status(400).json({
            success: false,
            message: "أدخل اسم مستخدم TikTok"
        });
    }

    /* قطع الاتصال السابق */

    if (connection) {
        try {
            await connection.disconnect();
        } catch (error) {
            console.log("Disconnect warning:", error.message);
        }

        connection = null;
    }

    currentUsername = username;

    /* تصفير بيانات البث */

    liveState.username = username;
    liveState.connected = false;

    liveState.viewers = 0;
    liveState.likes = 0;
    liveState.comments = 0;
    liveState.follows = 0;
    liveState.gifts = 0;

    liveState.tappers = [];
    liveState.members = [];
    liveState.events = [];

    console.log("");
    console.log("=================================");
    console.log(`🔄 الاتصال بـ @${username}`);
    console.log("=================================");

    try {

        connection = new WebcastPushConnection(username);

        /* =========================
           Connected
        ========================= */

        connection.on("connected", (state) => {

            liveState.connected = true;

            console.log(`✅ Connected: @${username}`);

            if (state?.roomId) {
                console.log(`Room ID: ${state.roomId}`);
            }
        });

        /* =========================
           Disconnected
        ========================= */

        connection.on("disconnected", () => {

            liveState.connected = false;

            console.log("❌ TikTok disconnected");
        });

        /* =========================
           Error
        ========================= */

        connection.on("error", (error) => {

            liveState.connected = false;

            console.log(
                "❌ TikTok Error:",
                error?.message || error
            );
        });

        /* =========================
           دخول شخص
        ========================= */

        connection.on("member", (data) => {

            const username = getUserName(data);
            const nickname = getNickname(data);
            const profilePicture = getProfilePicture(data);

            console.log(`👤 دخل اللايف: @${username}`);

            /* إضافة إلى القائمة */

            const existing = liveState.members.find(
                user => user.username === username
            );

            if (!existing) {

                liveState.members.unshift({
                    username,
                    nickname,
                    profilePicture,
                    joinedAt: new Date().toISOString()
                });

            } else {

                existing.joinCount =
                    (existing.joinCount || 1) + 1;
            }

            /* الحد الأقصى 1000 شخص */

            if (liveState.members.length > 1000) {
                liveState.members.length = 1000;
            }

            addEvent("member", data);
        });

        /* =========================
           تعليق
        ========================= */

        connection.on("chat", (data) => {

            const username = getUserName(data);
            const comment = data?.comment || "";

            liveState.comments++;

            console.log(
                `💬 @${username}: ${comment}`
            );

            addEvent("chat", data);
        });

        /* =========================
           متابعة
        ========================= */

        connection.on("follow", (data) => {

            const username = getUserName(data);

            liveState.follows++;

            console.log(
                `❤️ @${username} تابع البث`
            );

            addEvent("follow", data);
        });

        /* =========================
           تكبيس / Likes
        ========================= */

        connection.on("like", (data) => {

            const username = getUserName(data);
            const nickname = getNickname(data);
            const profilePicture = getProfilePicture(data);

            const count = Number(
                data?.likeCount || 1
            );

            liveState.likes += count;

            console.log(
                `👍 @${username} ×${count}`
            );

            /* البحث عن المستخدم */

            let tapper = liveState.tappers.find(
                user => user.username === username
            );

            if (!tapper) {

                tapper = {
                    username,
                    nickname,
                    profilePicture,
                    likes: 0
                };

                liveState.tappers.push(tapper);
            }

            /* إضافة التكبيسات */

            tapper.likes += count;

            /* ترتيب تنازلي */

            liveState.tappers.sort(
                (a, b) => b.likes - a.likes
            );

            /* الاحتفاظ بأفضل 100 */

            if (liveState.tappers.length > 100) {
                liveState.tappers.length = 100;
            }

            addEvent("like", data);
        });

        /* =========================
           هدية
        ========================= */

        connection.on("gift", (data) => {

            const username = getUserName(data);

            const giftName =
                data?.giftName ||
                data?.gift?.name ||
                "Unknown Gift";

            liveState.gifts++;

            console.log(
                `🎁 @${username}: ${giftName}`
            );

            addEvent("gift", data);
        });

        /* =========================
           بدء الاتصال
        ========================= */

        await connection.connect();

        res.json({
            success: true,
            username,
            message: "جاري الاتصال..."
        });

    } catch (error) {

        liveState.connected = false;

        console.log(
            "❌ فشل الاتصال:",
            error?.message || error
        );

        res.status(500).json({
            success: false,
            message:
                error?.message ||
                "فشل الاتصال"
        });
    }
});

/* =========================
   تشغيل السيرفر
========================= */

app.listen(PORT, () => {

    console.log("=================================");
    console.log("          SAMI LIVE");
    console.log("=================================");
    console.log(
        `🚀 Server started on port ${PORT}`
    );
    console.log("=================================");
});
