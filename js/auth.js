export function initAuth(apiUrl, onAuthenticated) {
  const token = localStorage.getItem("auth_token");

  // This check is purely for UX speed; the real security happens when the API token is verified by the Worker.
  if (token) {
    onAuthenticated(token);
  } else {
    showLoginModal(apiUrl, onAuthenticated);
  }
}

function showLoginModal(apiUrl, onSuccess) {
  const modal = document.createElement("div");
  modal.id = "auth-modal";
  modal.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h2>🔐 Accès Restreint</h2>
                <p>Veuillez vous identifier pour accéder aux données.</p>
                <form id="auth-form">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" required placeholder="votre@email.com">
                    </div>
                    <div class="form-group">
                        <label for="password">Mot de passe</label>
                        <input type="password" id="password" required placeholder="Mot de passe">
                    </div>
                    <button type="submit" class="cta-button" style="width: 100%; border: none; cursor: pointer;">Se connecter</button>
                    <p id="auth-error" style="color: red; font-size: 0.875rem; margin-top: 1rem; display: none;"></p>
                </form>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  document.body.style.overflow = "hidden";

  const form = document.getElementById("auth-form");
  const errorMsg = document.getElementById("auth-error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const btn = form.querySelector("button");

    btn.disabled = true;
    btn.textContent = "Connexion...";
    errorMsg.style.display = "none";

    try {
      const response = await fetch(`${apiUrl}login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur de connexion");
      }

      localStorage.setItem("auth_token", data.token);

      document.body.removeChild(modal);
      document.body.style.overflow = "";

      onSuccess(data.token);
    } catch (err) {
      errorMsg.textContent = err.message;
      errorMsg.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Se connecter";
    }
  });
}
