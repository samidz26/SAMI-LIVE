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

// حالة البث
const liveState = {
    username: null,
    connected: false,
    viewers: 0,
    likes: 0,
    comments: 0,
    follows: 0,
    gifts: 0
};

// الصفحة الرئيسية
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API: حالة الاتصال
app.get("/api/status", (req, res) => {
    res.json(liveState);
});

// API: الاتصال بـ TikTok
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

    // قطع الاتصال السابق
    if (connection) {
        try {
            await connection.disconnect();
        } catch (error) {
            // تجاهل الخطأ
        }

        connection = null;
    }

    currentUsername = username;

    // تصفير البيانات
    liveState.username = username;
    liveState.connected = false;
    liveState.viewers = 0;
    liveState.likes = 0;
    liveState.comments = 0;
    liveState.follows = 0;
    liveState.gifts = 0;

    console.log("");
    console.log("=================================");
    console.log(`🔄 الاتصال بـ @${username}`);
    console.log("=================================");

    try {
        connection = new WebcastPushConnection(username);

        // الاتصال
        connection.on("connected", (state) => {
            liveState.connected = true;

            console.log(`✅ تم الاتصال بـ @${username}`);
            console.log(`Room ID: ${state.roomId}`);
        });

        // قطع الاتصال
        connection.on("disconnected", () => {
            liveState.connected = false;

            console.log("❌ تم قطع الاتصال");
        });

        // خطأ
        connection.on("error", (error) => {
            liveState.connected = false;

            console.log("❌ TikTok Error:", error.message);
        });

        // دخول شخص إلى اللايف
        connection.on("member", (data) => {
            const username = data.uniqueId || "unknown";

            console.log(`👤 دخل اللايف: @${username}`);
        });

        // تعليق
        connection.on("chat", (data) => {
            const username = data.uniqueId || "unknown";
            const comment = data.comment || "";

            liveState.comments++;

            console.log(`💬 @${username}: ${comment}`);
        });

        // متابعة
        connection.on("follow", (data) => {
            const username = data.uniqueId || "unknown";

            liveState.follows++;

            console.log(`❤️ @${username} تابع البث`);
        });

        // إعجاب / تكبيس
        connection.on("like", (data) => {
            const username = data.uniqueId || "unknown";
            const count = Number(data.likeCount || 1);

            liveState.likes += count;

            console.log(`👍 @${username} ×${count}`);
        });

        // هدية
        connection.on("gift", (data) => {
            const username = data.uniqueId || "unknown";
            const giftName = data.giftName || "Unknown Gift";

            liveState.gifts++;

            console.log(`🎁 @${username}: ${giftName}`);
        });

        // بدء الاتصال
        await connection.connect();

        res.json({
            success: true,
            username,
            message: "جاري الاتصال..."
        });

    } catch (error) {
        liveState.connected = false;

        console.log("❌ فشل الاتصال:", error.message);

        res.status(500).json({
            success: false,
            message: error.message || "فشل الاتصال"
        });
    }
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log("=================================");
    console.log("       SAMI-LIVE-GAMES");
    console.log("=================================");
    console.log(`🚀 Server started on port ${PORT}`);
    console.log("=================================");
});
