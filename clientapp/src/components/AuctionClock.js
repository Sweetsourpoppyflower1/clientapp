import React, { useState, useEffect, useRef } from 'react';
import './AuctionClock.css';

const AuctionClock = ({ 
    startPrice = 100, 
    minPrice = 10, 
    startTime, 
    endTime,
    onPriceUpdate,
    resetTrigger = 0
}) => {
    const [currentPrice, setCurrentPrice] = useState(startPrice);
    const [progress, setProgress] = useState(0); // 0 to 100
    const [timeRemaining, setTimeRemaining] = useState('');
    const intervalRef = useRef(null);
    const startTimeRef = useRef(Date.now());

    // Calculate total duration in milliseconds
    const getTotalDuration = () => {
        if (!startTime || !endTime) return 60000; // Default 60 seconds
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();
        return Math.max(end - start, 1000);
    };

    // Calculate price based on elapsed time
    const calculatePrice = (elapsedTime, totalDuration) => {
        const ratio = Math.min(elapsedTime / totalDuration, 1);
        const priceRange = startPrice - minPrice;
        const price = startPrice - (priceRange * ratio);
        return Math.max(price, minPrice);
    };

    // Format time remaining
    const formatTimeRemaining = (ms) => {
        if (ms <= 0) return '00:00:00';
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    // Reset clock when purchase happens
    useEffect(() => {
        if (resetTrigger > 0) {
            startTimeRef.current = Date.now();
            setCurrentPrice(startPrice);
            setProgress(0);
        }
    }, [resetTrigger, startPrice]);

    // Main timer effect
    useEffect(() => {
        const totalDuration = getTotalDuration();
        
        const updateClock = () => {
            const now = Date.now();
            const elapsedTime = now - startTimeRef.current;
            
            // Calculate progress percentage
            const progressPercent = Math.min((elapsedTime / totalDuration) * 100, 100);
            setProgress(progressPercent);
            
            // Calculate current price
            const price = calculatePrice(elapsedTime, totalDuration);
            setCurrentPrice(price);
            
            // Calculate time remaining
            const remaining = Math.max(totalDuration - elapsedTime, 0);
            setTimeRemaining(formatTimeRemaining(remaining));
            
            // Notify parent of price update
            if (onPriceUpdate) {
                onPriceUpdate(price);
            }
            
            // Stop if we've reached the end
            if (elapsedTime >= totalDuration) {
                setCurrentPrice(minPrice);
                setProgress(100);
                if (onPriceUpdate) {
                    onPriceUpdate(minPrice);
                }
                clearInterval(intervalRef.current);
            }
        };
        
        // Initial update
        updateClock();
        
        // Update every 100ms for smooth animation
        intervalRef.current = setInterval(updateClock, 100);
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [startPrice, minPrice, startTime, endTime, onPriceUpdate]);

    // Generate price steps (10 steps)
    const priceSteps = [];
    for (let i = 0; i <= 10; i++) {
        const stepPrice = startPrice - ((startPrice - minPrice) * (i / 10));
        const angle = (i / 10) * 360;
        priceSteps.push({
            price: stepPrice.toFixed(2),
            angle: angle,
            position: i
        });
    }

    return (
        <div className="auction-clock-container">
            <div className="auction-clock-wrapper">
                <svg className="auction-clock-svg" viewBox="0 0 200 200">
                    {/* Background circle */}
                    <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="#e0e0e0"
                        strokeWidth="8"
                    />
                    
                    {/* Progress circle */}
                    <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="#2e7d32"
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 85}`}
                        strokeDashoffset={`${2 * Math.PI * 85 * (1 - progress / 100)}`}
                        transform="rotate(-90 100 100)"
                        className="progress-circle"
                    />
                    
                    {/* Price markers */}
                    {priceSteps.map((step, index) => {
                        const radian = (step.angle - 90) * (Math.PI / 180);
                        const markerX = 100 + 85 * Math.cos(radian);
                        const markerY = 100 + 85 * Math.sin(radian);
                        const labelX = 100 + 100 * Math.cos(radian);
                        const labelY = 100 + 100 * Math.sin(radian);
                        
                        return (
                            <g key={index}>
                                {/* Marker dot */}
                                <circle
                                    cx={markerX}
                                    cy={markerY}
                                    r="3"
                                    fill="#2e7d32"
                                    className="price-marker"
                                />
                                {/* Price label */}
                                <text
                                    x={labelX}
                                    y={labelY}
                                    fontSize="8"
                                    fontWeight="bold"
                                    fill="#2e7d32"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="price-label"
                                >
                                    €{step.price}
                                </text>
                            </g>
                        );
                    })}
                    
                    {/* Center circle */}
                    <circle
                        cx="100"
                        cy="100"
                        r="50"
                        fill="#2e7d32"
                        className="center-circle"
                    />
                </svg>
                
                {/* Center content */}
                <div className="auction-clock-center">
                    <div className="time-remaining">{timeRemaining}</div>
                    <div className="current-price">
                        €{currentPrice.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="price-label-text">Current Price</div>
                </div>
            </div>
        </div>
    );
};

export default AuctionClock;
