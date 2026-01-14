export const API_BASE = process.env.REACT_APP_API_URL || "";
export const apiUrl = (path) => `${API_BASE}${path}`;


export const fetchWithAuth = async (path, options = {}) => {
  const token = localStorage.getItem("auth_token");
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return fetch(apiUrl(path), {
    ...options,
    headers,
  });
};
