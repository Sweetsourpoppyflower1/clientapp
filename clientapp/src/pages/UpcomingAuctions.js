import React, { useState, useEffect } from "react";
import "./styles/Auctions.css";

function UpcomingAuctions() {
    // UseState, een tijdelijk opslag voor de Actieve Veilingen
    const [auctions, setUpcomingAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                const response = await fetch("https://localhost:7036/api/veilingen/opkomend");
                if (!response.ok) {
                    throw new Error("Er is een netwerkfout opgetreden");
                }
                const data = await response.json();
                setUpcomingAuctions(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }

        };
        fetchAuctions();
    }, []);

    return (
        <div className="upcoming-auctions-container">
            
            <h2>Upcoming Auctions</h2>
            <div className="auctions-list">
                {auctions.map((auction) => (
                    <div key={"VeilingsID =" + auction.veilingsID} className="auction-card">
                        <h3>VeilingsID = {auction.veilingsID} <br /> Veilingsmeester = {auction.veilingmeesterID}</h3>
                        <p>{auction.veilingmeester}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
export default UpcomingAuctions;