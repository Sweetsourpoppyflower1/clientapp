import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../pages/styles/Login.css";

function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        Email: "",
        Wachtwoord: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const looksLikeAuctionMaster = (obj) => {
        if (!obj || typeof obj !== "object") return false;
        return (
            "auctionMasterId" in obj ||
            "AuctionMasterId" in obj ||
            "email" in obj ||
            "Email" in obj ||
            "name" in obj ||
            "Name" in obj
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const resp = await fetch("https://localhost:7036/api/AuctionMaster/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Username: form.Email,
                    Password: form.Wachtwoord,
                }),
            });

            if (!resp.ok) {
                if (resp.status === 401) {
                    setError("Invalid email or password.");
                } else {
                    const txt = await resp.text();
                    setError(txt || "Login failed.");
                }
                return;
            }

            const data = await resp.json();

            const auctionMaster =
                data?.auctionMaster ?? data?.AuctionMaster ?? (looksLikeAuctionMaster(data) ? data : null);

            if (auctionMaster) {
                localStorage.setItem("auctionMaster", JSON.stringify(auctionMaster));
                navigate("/auctionmasterDashboard");
            } else {
                localStorage.removeItem("auctionMaster");
                navigate("/homepage");
            }
        } catch (ex) {
            console.error(ex);
            setError("Network error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Inloggen</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email:</label>
                    <input
                        type="text"
                        name="Email"
                        value={form.Email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Wachtwoord:</label>
                    <input
                        type="password"
                        name="Wachtwoord"
                        value={form.Wachtwoord}
                        onChange={handleChange}
                        required
                    />
                </div>

                {error && <div className="login-error" style={{ color: "crimson", marginTop: 8 }}>{error}</div>}

                <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
                    {loading ? "Inloggen..." : "Inloggen"}
                </button>
            </form>
        </div>
    );
}

export default Login;
