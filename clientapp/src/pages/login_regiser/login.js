import React, { useEffect, useState } from "react";
import "../../styles/login_registerPages/loginStyle.css";

const AUTH_ENDPOINT = "/api/Auth/login";

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded;
  } catch (e) {
    console.error("JWT decode error:", e);
    return null;
  }
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    const mediaId = 1;
    fetch(`/api/Media/${mediaId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch media');
        return res.json();
      })
      .then(m => {
        const normalizedUrl = m.url && !m.url.startsWith('/') ? `/${m.url}` : m.url;
        setLogo({ url: normalizedUrl, alt: m.alt_text });
      })
      .catch((err) => {
        console.warn("Logo fetch failed:", err);
      });
  }, []);

  function redirectForRole(role) {
    if (!role) {
      console.error("No role provided for redirect");
      return;
    }
    const r = String(role).toLowerCase().trim();
    console.log(`🔀 Redirecting for role: ${r}`);

    if (r === "client") {
      window.location.href = "/company/companyDashboard";
    } else if (r === "supplier") {
      window.location.href = "/supplier/supplierDashboard";
    } else if (r === "admin") {
      window.location.href = "/master/auctionmasterDashboard";
    } else {
      console.warn(`Unknown role: ${r}`);
      window.location.href = "/login_register/login";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("📡 Sending login request...");

      const res = await fetch(AUTH_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email,    // Changed from Email to email (lowercase)
          password: password  // Changed from Password to password (lowercase)
        }),
      });

      console.log(`📊 Login response status: ${res.status}`);

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        console.error("❌ Login failed response:", text);
        throw new Error(text || `Login failed (${res.status})`);
      }

      const data = await res.json();
      console.log("✅ Login response received:", {
        hasToken: !!data?.token,
        hasRoles: !!data?.roles,
        hasData: !!data?.data,
        email: data?.email
      });

      // Priority 1: Check for roles in response
      const roles = data?.roles || data?.Roles || [];
      
      if (Array.isArray(roles) && roles.length > 0) {
        console.log(`✅ Roles found in response: ${roles.join(", ")}`);
        
        // Store user information
        localStorage.setItem("user_email", data?.email || "");
        localStorage.setItem("user_roles", JSON.stringify(roles));
        
        // Store supplier data if available
        if (data?.data) {
          localStorage.setItem("user_data", JSON.stringify(data.data));
          if (data.data.SupplierId) {
            localStorage.setItem("supplierId", data.data.SupplierId);
            console.log(`✅ Supplier ID stored: ${data.data.SupplierId}`);
          }
        }

        // Store token if provided
        if (data?.token) {
          localStorage.setItem("auth_token", data.token);
          console.log(`✅ JWT Token stored (length: ${data.token.length})`);
        }

        redirectForRole(roles[0]);
        return;
      }

      // Priority 2: Check for token and decode roles from it
      const token = data?.token || data?.access_token || data?.accessToken;
      if (token) {
        console.log("✅ Token found in response, storing and decoding...");
        localStorage.setItem("auth_token", token);

        const payload = decodeJwt(token);
        console.log("🔍 Token payload:", payload);

        if (payload) {
          // Try different role claim formats
          const claimKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
          let rolesFromToken = payload?.role || 
                               payload?.roles || 
                               payload?.[claimKey] || 
                               [];

          // Ensure it's an array
          if (typeof rolesFromToken === 'string') {
            rolesFromToken = [rolesFromToken];
          }

          if (Array.isArray(rolesFromToken) && rolesFromToken.length > 0) {
            console.log(`✅ Roles decoded from token: ${rolesFromToken.join(", ")}`);
            
            // Store user information
            localStorage.setItem("user_email", data?.email || "");
            localStorage.setItem("user_roles", JSON.stringify(rolesFromToken));

            if (data?.data) {
              localStorage.setItem("user_data", JSON.stringify(data.data));
              if (data.data.SupplierId) {
                localStorage.setItem("supplierId", data.data.SupplierId);
                console.log(`✅ Supplier ID stored: ${data.data.SupplierId}`);
              }
            }

            redirectForRole(rolesFromToken[0]);
            return;
          }
        }
      }

      // If we reach here, we couldn't get roles or token
      console.error("❌ No roles or token found in login response");
      console.log("Full response:", data);
      setError("Login succeeded but no role information returned. Please contact support.");
      setLoading(false);
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err.message || "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="parent">
      <div className="header">
        {logo ? (
          <img src={logo.url} alt={logo.alt} className="u-top-logo" />
        ) : (
          <span className="loading-label">Loading…</span>
        )}
      </div>

      {error && (
        <div style={{ 
          color: "#d32f2f", 
          padding: "12px 16px", 
          margin: "16px", 
          backgroundColor: "#ffebee",
          borderRadius: "4px",
          border: "1px solid #ef5350"
        }}>
          ⚠️ {error}
        </div>
      )}

      <div className="login">
        <div className="login-infocard">
          <div className="infocard">
            <h2>Log in</h2>
            <p>Log in to your account at Flauction</p>
          </div>
        </div>

        <div className="login-form">
          <form className="form" onSubmit={handleSubmit}>
            <div className="email">
              <label className="email-title">Email</label>
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
              />
            </div>

            <div className="password">
              <label className="password-title">Password</label>
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <button
                className="login-btn"
                type="submit"
                disabled={loading}
                style={{ width: "100%", padding: 10 }}
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </div>

            <div className="register-placeholder" style={{ textAlign: "center" }}>
              <div style={{ marginBottom: 8 }}>No Account? Register here:</div>
              <button
                className="register-btn"
                type="button"
                onClick={() => (window.location.href = "/login_register/registerOptions")}
                style={{ width: "70%", padding: 8 }}
              >
                Register
              </button>
            </div>
          </form>
        </div>

        <div className="empty"></div>
      </div>
    </div>
  );
}