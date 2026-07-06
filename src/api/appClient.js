const TOKEN_KEY = "manga_cards_token";
const API_WAKE_EVENT = "manga-api-wake-status";

const emitApiStatus = (status, attempt = 0) => {
  window.dispatchEvent(new CustomEvent(API_WAKE_EVENT, { detail: { status, attempt } }));
};

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

const params = new URLSearchParams(window.location.search);
const tokenFromUrl = params.get("access_token");
if (tokenFromUrl) {
  localStorage.setItem(TOKEN_KEY, tokenFromUrl);
  params.delete("access_token");
  const query = params.toString();
  window.history.replaceState({}, document.title, `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
}

const request = async (path, options = {}) => {
  const maxAttempts = options.wakeRetry === false ? 1 : 16;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`/api${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const responseBody = isJson ? await response.json().catch(() => ({})) : {};
      const isSleepingResponse = [502, 503, 504].includes(response.status) || (!isJson && response.status >= 500);

      if (isSleepingResponse && attempt < maxAttempts) {
        emitApiStatus("waking", attempt);
        await wait(Math.min(5000, 1200 + attempt * 300));
        continue;
      }
      if (!response.ok) {
        const responseError = new Error(responseBody.message || `Erreur ${response.status}`);
        responseError.noWakeRetry = true;
        throw responseError;
      }
      if (!isJson) throw new Error("Le serveur de jeu est encore en cours de réveil.");
      emitApiStatus("ready", attempt);
      return responseBody;
    } catch (error) {
      lastError = error;
      if (error.noWakeRetry) {
        emitApiStatus("ready", attempt);
        throw error;
      }
      if (attempt >= maxAttempts) break;
      emitApiStatus("waking", attempt);
      await wait(Math.min(5000, 1200 + attempt * 300));
    }
  }

  emitApiStatus("error", maxAttempts);
  throw lastError || new Error("Serveur temporairement indisponible.");
};

const entity = (name) => ({
  list: (sort, limit, skip, fields) => {
    if (name === "Card") {
      return request("/functions/getMyCards", {
        method: "POST",
        body: JSON.stringify({ sort, limit, skip, fields }),
      }).then((response) => response.data || []);
    }
    return request(`/entities/${name}?${new URLSearchParams({
      ...(sort ? { sort } : {}),
      ...(limit ? { limit } : {}),
      ...(skip ? { skip } : {}),
      ...(fields ? { fields: Array.isArray(fields) ? fields.join(",") : fields } : {}),
    })}`);
  },
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

const optimizeImageUpload = async (file) => {
  const maxRawBytes = 3 * 1024 * 1024;
  if (file.type === "image/gif") {
    if (file.size > maxRawBytes) throw new Error("Le GIF dépasse 3 Mo. Réduis sa taille avant l’envoi.");
    return file;
  }
  if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) throw new Error("Format non pris en charge. Utilise PNG, JPG, WEBP ou GIF.");
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, 1400 / bitmap.width, 1960 / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));
  if (file.size <= maxRawBytes && ratio === 1 && file.type === "image/webp") { bitmap.close(); return file; }
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d", { alpha: true });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise((resolve, reject) => canvas.toBlob(
    value => value ? resolve(value) : reject(new Error("Compression de l’image impossible.")),
    "image/webp", 0.86,
  ));
  if (blob.size > maxRawBytes) throw new Error("L’image reste trop lourde après compression. Utilise une image moins grande.");
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "carte"}.webp`, { type: "image/webp" });
};

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
      const query = new URLSearchParams({ from_url: fromUrl, origin: window.location.origin });
      window.location.href = `/api/auth/${provider}?${query}`;
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
        const originalSize = file.size;
        const optimizedFile = await optimizeImageUpload(file);
        const data_url = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(optimizedFile);
        });
        const result = await request("/uploads", {
          method: "POST",
          body: JSON.stringify({ data_url, name: optimizedFile.name, type: optimizedFile.type }),
          wakeRetry: false,
        });
        return { ...result, original_size: originalSize, uploaded_size: optimizedFile.size, optimized: optimizedFile !== file };
      },
    },
  },
};

export { API_WAKE_EVENT };
