const BASE_URL = "http://localhost:3001/api";

function getToken() {
  return const adminToken = localStorage.getItem("adminToken");
const citizenToken = localStorage.getItem("citizenToken");

const token = adminToken || citizenToken;
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const api = {
  // Generic GET and POST
  get: (path: string) => request(path),
  post: (path: string, body: object) =>
    request(path, { method: "POST", body: JSON.stringify(body) }),

  // Auth
  login: (email: string, password: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  me: () => request("/auth/me"),

  // Dashboard
  stats: () => request("/dashboard/stats"),

  // Parcels
  getParcels: (params = "") => request(`/parcels?${params}`),
  getParcel: (id: string) => request(`/parcels/${id}`),
  createParcel: (data: object) =>
    request("/parcels", { method: "POST", body: JSON.stringify(data) }),
  updateParcel: (id: string, data: object) =>
    request(`/parcels/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteParcel: (id: string) =>
    request(`/parcels/${id}`, { method: "DELETE" }),

  // Transfers
  getTransfers: (params = "") => request(`/transfers?${params}`),
  createTransfer: (data: object) =>
    request("/transfers", { method: "POST", body: JSON.stringify(data) }),
  advanceTransfer: (id: string, data: object) =>
    request(`/transfers/${id}/step`, { method: "PATCH", body: JSON.stringify(data) }),

  // Loans
  getLoans: (params = "") => request(`/loans?${params}`),
  createLoan: (data: object) =>
    request("/loans", { method: "POST", body: JSON.stringify(data) }),
  repayLoan: (id: string, amount: number) =>
    request(`/loans/${id}/repay`, { method: "PATCH", body: JSON.stringify({ amount }) }),

  // Inheritance
  getWills: (params = "") => request(`/inheritance?${params}`),
  createWill: (data: object) =>
    request("/inheritance", { method: "POST", body: JSON.stringify(data) }),
  executeWill: (id: string) =>
    request(`/inheritance/${id}/execute`, { method: "PATCH" }),
  revokeWill: (id: string) =>
    request(`/inheritance/${id}/revoke`, { method: "PATCH" }),
};