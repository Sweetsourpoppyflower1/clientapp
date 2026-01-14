import React, { useState, useEffect, useRef } from 'react';
import './AuctionClock.css';

const AuctionClock = ({
    startPrice = 100,
    minPrice = 10,
    durationMs = 60000,
    onPriceUpdate,
    resetTrigger = 0,
    startTime
}) => {
    const [currentPrice, setCurrentPrice] = useState(startPrice);
    const [progress, setProgress] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState('');
    const intervalRef = useRef(null);

    const calculatePrice = (elapsedTime) => {
        const ratio = Math.min(elapsedTime / durationMs, 1);
        return Math.max(startPrice - (startPrice - minPrice) * ratio, minPrice);
    };

    const formatTimeRemaining = (ms) => {
        if (ms <= 0) return '00:00:00';
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    useEffect(() => {
        const updateClock = () => {
            const now = Date.now();
            const elapsedTime = now - startTime;

            if (elapsedTime < 0) {
                setTimeRemaining(formatTimeRemaining(-elapsedTime));
                setCurrentPrice(startPrice);
                setProgress(0);
                if (onPriceUpdate) onPriceUpdate(startPrice);
                return;
            }

            const remainingTime = Math.max(durationMs - elapsedTime, 0);
            setTimeRemaining(formatTimeRemaining(remainingTime));

            const price = calculatePrice(elapsedTime);
            setCurrentPrice(price);

            const progressPercent = Math.min((elapsedTime / durationMs) * 100, 100);
            setProgress(progressPercent);

            if (onPriceUpdate) onPriceUpdate(price);

            if (elapsedTime >= durationMs && intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };

        updateClock();
        intervalRef.current = setInterval(updateClock, 100);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [startTime, startPrice, minPrice, durationMs, resetTrigger, onPriceUpdate]);

    const circumference = 2 * Math.PI * 85;
    const strokeDashoffset = circumference * (1 - progress / 100);

    return (
        <div className="auction-clock-container">
            <div className="auction-clock-wrapper">
                <svg className="auction-clock-svg" viewBox="0 0 200 200">
                    <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        strokeWidth="12"
                    />

                    <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 100 100)"
                        className="progress-circle"
                        strokeLinecap="round"
                    />

                    <circle
                        cx="100"
                        cy="100"
                        r="65"
                        className="center-circle"
                    />
                    
                    <circle
                        cx="100"
                        cy="100"
                        r="58"
                        className="center-circle"
                    />
                </svg>

                <div className="auction-clock-center">
                    <div className="time-remaining">{timeRemaining}</div>
                    <div className="current-price">
                        €{currentPrice.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="price-label-text">Current Price</div>
                </div>
            </div>

            <div className="auction-clock-price-range">
                <div className="price-range-item">
                    <span className="price-range-label">Max Price</span>
                    <span className="price-range-value">€{startPrice.toFixed(2).replace('.', ',')}</span>
                </div>
            </div>
        </div>
    );
};

export default AuctionClock;
