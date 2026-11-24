let inMemoryToken = null;

export function setInMemoryToken(token) {
  inMemoryToken = token || null;
}

export function getInMemoryToken() {
  return inMemoryToken;
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, headers = {} } = options;
  const finalHeaders = {
    'X-Requested-With': 'XMLHttpRequest',
    ...headers,
  };

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (inMemoryToken) {
    finalHeaders.Authorization = `Bearer ${inMemoryToken}`;
  }

  const response = await fetch(path, {
    method,
    credentials: 'include',
    headers: finalHeaders,
    body: body !== undefined ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });

  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!response.ok) {
    const err = new Error(data.error || `Request failed (${response.status})`);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: (path) => apiRequest(path, { method: 'GET' }),
  post: (path, body) => apiRequest(path, { method: 'POST', body }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body }),
  del: (path) => apiRequest(path, { method: 'DELETE' }),
};
