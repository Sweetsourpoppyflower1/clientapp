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
    const [progress, setProgress] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState('');
    const [auctionStarted, setAuctionStarted] = useState(true);
    const [timeUntilStart, setTimeUntilStart] = useState('');
    const intervalRef = useRef(null);
    const startTimeRef = useRef(Date.now());

    const getTotalDuration = () => {
        if (!startTime || !endTime) return 60000;
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();
        return Math.max(end - start, 1000);
    };

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
        if (resetTrigger > 0) {
            startTimeRef.current = Date.now();
            setCurrentPrice(startPrice);
            setProgress(0);
        }
    }, [resetTrigger, startPrice]);

    useEffect(() => {
        const totalDuration = getTotalDuration();
        
        const updateClock = () => {
            const now = Date.now();
            
            if (startTime) {
                const auctionStartTimeMs = new Date(startTime).getTime();
                if (now < auctionStartTimeMs) {
                    setAuctionStarted(false);
                    const timeUntil = auctionStartTimeMs - now;
                    setTimeUntilStart(formatTimeRemaining(timeUntil));
                    setCurrentPrice(startPrice);
                    setProgress(0);
                    if (onPriceUpdate) {
                        onPriceUpdate(startPrice);
                    }
                    return;
                } else if (!auctionStarted) {
                    setAuctionStarted(true);
                    startTimeRef.current = now;
                }
            }
            
            const elapsedTime = now - startTimeRef.current;
            const progressPercent = Math.min((elapsedTime / totalDuration) * 100, 100);
            setProgress(progressPercent);
            
            const price = calculatePrice(elapsedTime, totalDuration);
            setCurrentPrice(price);
            
            const remaining = Math.max(totalDuration - elapsedTime, 0);
            setTimeRemaining(formatTimeRemaining(remaining));
            
            if (onPriceUpdate) {
                onPriceUpdate(price);
            }
            
            if (elapsedTime >= totalDuration) {
                setCurrentPrice(minPrice);
                setProgress(100);
                if (onPriceUpdate) {
                    onPriceUpdate(minPrice);
                }
                clearInterval(intervalRef.current);
            }
        };
        
        updateClock();
        intervalRef.current = setInterval(updateClock, 100);
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [startPrice, minPrice, startTime, endTime, onPriceUpdate, auctionStarted]);

    const priceSteps = [];
    for (let i = 0; i < 10; i++) {
        const stepPrice = startPrice - ((startPrice - minPrice) * (i / 10));
        const angle = (i / 10) * 360;
        priceSteps.push({
            price: Math.round(stepPrice),
            angle: angle,
            position: i
        });
    }

    return (
        <div className="auction-clock-container">
            <div className="auction-clock-wrapper">
                <svg className="auction-clock-svg" viewBox="0 0 280 280">
                    <circle
                        cx="140"
                        cy="140"
                        r="85"
                        fill="none"
                        stroke="#e0e0e0"
                        strokeWidth="8"
                    />
                    
                    <circle
                        cx="140"
                        cy="140"
                        r="85"
                        fill="none"
                        stroke="#2e7d32"
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 85}`}
                        strokeDashoffset={`${2 * Math.PI * 85 * (1 - progress / 100)}`}
                        transform="rotate(-90 140 140)"
                        className="progress-circle"
                    />
                    
                    {priceSteps.map((step, index) => {
                        const radian = (step.angle - 90) * (Math.PI / 180);
                        const markerX = 140 + 85 * Math.cos(radian);
                        const markerY = 140 + 85 * Math.sin(radian);
                        const labelX = 140 + 110 * Math.cos(radian);
                        const labelY = 140 + 110 * Math.sin(radian);
                        
                        return (
                            <g key={index}>
                                <circle
                                    cx={markerX}
                                    cy={markerY}
                                    r="3"
                                    fill="#2e7d32"
                                    className="price-marker"
                                />
                                <text
                                    x={labelX}
                                    y={labelY}
                                    fontSize="10"
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
                    
                    <circle
                        cx="140"
                        cy="140"
                        r="50"
                        fill="#2e7d32"
                        className="center-circle"
                    />
                </svg>
                
                <div className="auction-clock-center">
                    {!auctionStarted ? (
                        <>
                            <div className="time-remaining">{timeUntilStart}</div>
                            <div className="current-price" style={{ fontSize: '14px', lineHeight: '1.2' }}>
                                Veiling nog niet<br/>begonnen
                            </div>
                            <div className="price-label-text">Begint over</div>
                        </>
                    ) : (
                        <>
                            <div className="time-remaining">{timeRemaining}</div>
                            <div className="current-price">
                                €{currentPrice.toFixed(2).replace('.', ',')}
                            </div>
                            <div className="price-label-text">Current Price</div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuctionClock;
