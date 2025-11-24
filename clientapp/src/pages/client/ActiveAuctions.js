import React, { useState, useEffect } from "react";
import "../styles/Auctions.css";

function ActiveAuctions() {
    // UseState, een tijdelijk opslag voor de Actieve Veilingen
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                const response = await fetch("https://localhost:7036/api/Auction");
                if (!response.ok) {
                    throw new Error("Er is een netwerkfout opgetreden");
                }
                const data = await response.json();
                setAuctions(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }

        };
        fetchAuctions();
    }, []);

    return (
        <div className="active-auctions-container">
            <h2>Active Auctions</h2>
            <div className="auctions-list">
                {auctions.map((auction) => (
                    <div key={"VeilingsID =" + auction.auction_id} className="auction-card">
                        <h3>VeilingsID = {auction.auction_id} <br /> Veilingsmeester = {auction.a}</h3>
                        <p>{auction.veilingmeester}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
export default ActiveAuctions;