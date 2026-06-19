const TOKEN_KEY = "manga_cards_token";

const params = new URLSearchParams(window.location.search);
const tokenFromUrl = params.get("access_token");
if (tokenFromUrl) {
  localStorage.setItem(TOKEN_KEY, tokenFromUrl);
  params.delete("access_token");
  const query = params.toString();
  window.history.replaceState({}, document.title, `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
}

const request = async (path, options = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `Erreur ${response.status}`);
  return body;
};

const entity = (name) => ({
  list: (sort, limit, skip, fields) => request(`/entities/${name}?${new URLSearchParams({
    ...(sort ? { sort } : {}),
    ...(limit ? { limit } : {}),
    ...(skip ? { skip } : {}),
    ...(fields ? { fields: Array.isArray(fields) ? fields.join(",") : fields } : {}),
  })}`),
  filter: (query = {}, sort, limit, skip, fields) => request(`/entities/${name}/filter`, {
    method: "POST",
    body: JSON.stringify({ query, sort, limit, skip, fields }),
  }),
  get: (id) => request(`/entities/${name}/${id}`),
  create: (data) => request(`/entities/${name}`, { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/entities/${name}/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => request(`/entities/${name}/${id}`, { method: "DELETE" }),
  bulkCreate: (items) => request(`/entities/${name}/bulk`, { method: "POST", body: JSON.stringify(items) }),
});

export const appClient = {
  auth: {
    me: () => request("/auth/me"),
    updateMe: (data) => request("/auth/me", { method: "PUT", body: JSON.stringify(data) }),
    loginViaEmailPassword: async (email, password) => {
      const result = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      localStorage.setItem(TOKEN_KEY, result.access_token);
      return result;
    },
    register: async ({ email, password, full_name }) => {
      const result = await request("/auth/register", { method: "POST", body: JSON.stringify({ email, password, full_name }) });
      localStorage.setItem(TOKEN_KEY, result.access_token);
      return result;
    },
    logout: async () => {
      try { await request("/auth/logout", { method: "POST" }); } catch { /* La deconnexion locale doit toujours fonctionner. */ }
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = "/login";
    },
    loginWithProvider: (provider, fromUrl = "/") => {
      window.location.href = `/api/auth/${provider}?from_url=${encodeURIComponent(fromUrl)}`;
    },
    resetPasswordRequest: (email) => request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
    resetPassword: ({ resetToken, newPassword }) => request("/auth/reset-password", { method: "POST", body: JSON.stringify({ resetToken, newPassword }) }),
    setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  },
  entities: new Proxy({}, { get: (_, name) => entity(name) }),
  functions: {
    invoke: async (name, payload = {}) => {
      if (name === "uploadImage" && payload.file) {
        const uploaded = await appClient.integrations.Core.UploadFile({ file: payload.file });
        return { data: { url: uploaded.file_url } };
      }
      return request(`/functions/${name}`, { method: "POST", body: JSON.stringify(payload) });
    },
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        if (typeof file === "string") return { file_url: file };
        const data_url = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        return request("/uploads", {
          method: "POST",
          body: JSON.stringify({ data_url, name: file.name, type: file.type }),
        });
      },
    },
  },
};
