import React, { useEffect, useState } from "react";

export default function AOverviewUpcomingAuctions() {
    const [upcoming, setUpcoming] = useState([]);
    const [plantMap, setPlantMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        async function loadAuctionsAndPlants() {
            try {
                const res = await fetch("/api/Auctions");
                if (!res.ok) throw new Error(`Auctions endpoint returned ${res.status}`);
                const all = await res.json();

                const filtered = Array.isArray(all)
                    ? all.filter(
                        (a) =>
                            a &&
                            a.status &&
                            String(a.status).toLowerCase() === "upcoming"
                    )
                    : [];

                let map = {};
                try {
                    const pRes = await fetch("/api/Plants");
                    if (pRes.ok) {
                        const plants = await pRes.json();
                        if (Array.isArray(plants)) {
                            plants.forEach((p) => {
                                const id = p?.plant_id ?? p?.PlantId ?? p?.plantId;
                                const name =
                                    p?.productname ??
                                    p?.productName ??
                                    p?.ProductName ??
                                    p?.name ??
                                    p?.Name;
                                if (id != null) map[String(id)] = name ?? String(id);
                            });
                        }
                    }
                } catch (plantErr) {
                }

                if (mounted) {
                    setUpcoming(filtered);
                    setPlantMap(map);
                    setLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setError(err.message || "Failed to load auctions");
                    setLoading(false);
                }
            }
        }

        loadAuctionsAndPlants();
        return () => {
            mounted = false;
        };
    }, []);

    if (loading) return <div>Loading upcoming auctions...</div>;
    if (error) return <div>Error loading auctions: {error}</div>;

    return (
        <div>
            <h2>Upcoming Auctions</h2>
            {upcoming.length === 0 && <div>No upcoming auctions found.</div>}
            <ul>
                {upcoming.map((a) => {
                    const plantKey = String(a.plant_id ?? a.PlantId ?? a.plantId);
                    const plantName = plantMap[plantKey];
                    return (
                        <li key={a.auction_id}>
                            <div>Plant: {plantName ?? a.plant_id}</div>
                            <div>
                                Start:{" "}
                                {a.start_time
                                    ? new Date(a.start_time).toLocaleString()
                                    : "N/A"}
                            </div>
                            <div>
                                End: {a.end_time ? new Date(a.end_time).toLocaleString() : "N/A"}
                            </div>
                            <div>Start Price: {a.start_price}</div>
                            <div>Min Price: {a.min_price}</div>
                            <hr />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}