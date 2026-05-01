export function getSession() {
  const raw = localStorage.getItem("tm_user");
  const token = localStorage.getItem("tm_token");
  if (!raw || !token) return null;
  try {
    const user = JSON.parse(raw);
    return { user, token };
  } catch {
    return null;
  }
}

export function setSession({ token, user }) {
  localStorage.setItem("tm_token", token);
  localStorage.setItem("tm_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("tm_token");
  localStorage.removeItem("tm_user");
}

