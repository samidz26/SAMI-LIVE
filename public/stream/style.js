.stream-content {
    position: relative;
    z-index: 4;

    width: 100%;
    height: calc(100% - 120px);

    padding: 15px 25px;

    display: flex;
    justify-content: center;
    align-items: center;
}

.stream-card {
    width: 100%;
    max-width: 420px;

    padding: 25px;

    border: 1px solid rgba(255, 255, 255, 0.10);

    border-radius: 18px;

    background: rgba(0, 0, 0, 0.20);

    box-shadow:
        inset 0 0 30px rgba(255, 255, 255, 0.02),
        0 15px 40px rgba(0, 0, 0, 0.25);
}

.stream-icon {
    text-align: center;

    font-size: 18px;

    color: #d6b36a;

    text-shadow:
        0 0 15px rgba(214, 179, 106, 0.8);

    animation: streamPulse 1.5s infinite;
}

@keyframes streamPulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.4;
    }
}

.stream-title {
    margin-top: 8px;
    margin-bottom: 20px;

    text-align: center;

    font-size: 18px;

    font-weight: 700;

    color: white;
}

.stream-row {
    display: flex;

    justify-content: space-between;
    align-items: center;

    padding: 13px 0;

    border-bottom: 1px solid rgba(255, 255, 255, 0.06);

    font-size: 12px;

    color: rgba(255, 255, 255, 0.50);
}

.stream-row:last-child {
    border-bottom: none;
}

.stream-row strong {
    color: #d6b36a;

    font-size: 13px;
}

@media (max-width: 500px) {

    .stream-content {
        padding: 10px 15px;
    }

    .stream-card {
        padding: 20px;
    }
}
