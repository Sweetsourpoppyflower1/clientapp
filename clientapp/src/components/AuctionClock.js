import React, { useState, useEffect, useRef } from 'react';
import './AuctionClock.css';

const AuctionClock = ({ 
    startPrice = 100, 
    minPrice = 10, 
    durationMs = 60000,
    onPriceUpdate,
    resetTrigger = 0
}) => {
    const [currentPrice, setCurrentPrice] = useState(startPrice);
    const [progress, setProgress] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState('');
    const intervalRef = useRef(null);
    const startTimeRef = useRef(Date.now());

    const calculatePrice = (elapsedTime, totalDuration) => {
        const ratio = Math.min(elapsedTime / totalDuration, 1);
        const priceRange = startPrice - minPrice;
        const price = startPrice - (priceRange * ratio);
        return Math.max(price, minPrice);
    };

    const formatTimeRemaining = (ms) => {
        if (ms <= 0) return '00:00:00';
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    useEffect(() => {
        startTimeRef.current = Date.now();
        setCurrentPrice(startPrice);
        setProgress(0);
    }, [resetTrigger, startPrice]);

    useEffect(() => {
        const updateClock = () => {
            const now = Date.now();
            const elapsedTime = now - startTimeRef.current;
            
            if (elapsedTime >= durationMs) {
                setCurrentPrice(minPrice);
                setProgress(100);
                setTimeRemaining('00:00:00');
                if (onPriceUpdate) {
                    onPriceUpdate(minPrice);
                }
                clearInterval(intervalRef.current);
                return;
            }
            
            const progressPercent = Math.min((elapsedTime / durationMs) * 100, 100);
            setProgress(progressPercent);
            
            const price = calculatePrice(elapsedTime, durationMs);
            setCurrentPrice(price);
            
            const remaining = Math.max(durationMs - elapsedTime, 0);
            setTimeRemaining(formatTimeRemaining(remaining));
            
            if (onPriceUpdate) {
                onPriceUpdate(price);
            }
        };
        
        updateClock();
        intervalRef.current = setInterval(updateClock, 100);
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [startPrice, minPrice, durationMs, onPriceUpdate]);

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
                        stroke="#3a3a3a"
                        strokeWidth="12"
                    />
                    
                    <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="#5A786B"
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
                        fill="#1a1a2e"
                        className="center-circle"
                    />
                </svg>
                
                <div className="auction-clock-center">
                    <div className="time-remaining">{timeRemaining}</div>
                    <div className="current-price">
                        €{currentPrice.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="price-label-text">Huidige prijs</div>
                </div>
            </div>
            
            <div className="auction-clock-price-range">
                <div className="price-range-item">
                    <span className="price-range-label">Max Prijs</span>
                    <span className="price-range-value">€{startPrice.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="price-range-item">
                    <span className="price-range-label">Min Prijs</span>
                    <span className="price-range-value">€{minPrice.toFixed(2).replace('.', ',')}</span>
                </div>
            </div>
        </div>
    );
};

export default AuctionClock;
