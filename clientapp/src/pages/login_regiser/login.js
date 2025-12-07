import React, { useState } from "react";
import "../../styles/login_registerPages/loginStyle.css";

const AUTH_ENDPOINT = "/api/Auth/login";

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded;
  } catch (e) {
    return null;
  }
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function redirectForRole(role) {
    if (!role) return;
    const r = String(role).toLowerCase();
    if (r === "client") window.location.href = "/companyDashboard";
    else if (r === "supplier") window.location.href = "/supplierDashboard";
    else if (r === "admin") window.location.href = "/auctionmasterDashboard";
    else window.location.href = "/login_register/login";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(AUTH_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email, Password: password }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(text || `Login failed (${res.status})`);
      }

      const data = await res.json();

      const roles = data?.roles ?? data?.Roles ?? null;
      if (Array.isArray(roles) && roles.length > 0) {
        redirectForRole(roles[0]);
        return;
      }

      const token = data?.token ?? data?.access_token ?? data?.accessToken;
      if (token) {
        localStorage.setItem("auth_token", token);
        const payload = decodeJwt(token);
        const claimKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
        const rolesFromToken =
          payload?.role ||
          payload?.roles ||
          payload?.[claimKey] ||
          [];
        const firstRole = Array.isArray(rolesFromToken) ? rolesFromToken[0] : rolesFromToken;
        redirectForRole(firstRole);
        return;
      }

      setError("Login succeeded but no role information returned.");
      setLoading(false);
    } catch (err) {
      setError(err.message || "Login failed");
      setLoading(false);
    }
  }

    return (
        <div className="parent">

            <div className="header">
                <h2>Flauction</h2>
            </div>

            {error && <div style={{ color: "red" }}>{error}</div>}

            <div className="login">

                <div className="login-infocard">
                    <div class="infocard">
                        <h2>Log in</h2>
                        <p>Log in to your account at Flauction</p>
                    </div>
                    
                </div>                

                <div className="login-form">
                    <form className="form" onSubmit={handleSubmit}>

                        <div className="email">
                            <label className="email-title">Email</label>
                            <input type="email" required placeholder="Email"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }} />
                        </div>

                        <div className="password">
                            <label className="password-title">Password</label>
                            <input type="password" required placeholder="Password"
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                style={{ width: "100%", padding: 8, boxSizing: "border-box" }} />
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <button className="login-btn "type="submit" disabled={loading}
                                style={{ width: "100%", padding: 10 }}> {loading ? "Signing in..." : "Login"}
                            </button>
                        </div>

                        <div className="register-placeholder"style={{ textAlign: "center" }}>
                            <div style={{ marginBottom: 8 }}>No Account? Register here:</div>

                            <button className="register-btn" type="button" onClick={() => (window.location.href = "/login_register/registerOptions")}
                                style={{ width: "70%", padding: 8 }} > Register
                            </button>
                        </div>                    

                    </form>
                </div>

                <div className="empty">

                </div>

            </div>
        </div>
    );
}