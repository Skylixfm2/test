<%@ include file="layout/header.jspf" %>
<section class="auth-panel">
    <h1>Administration</h1>
    <c:if test="${not empty error}"><p class="alert">${error}</p></c:if>
    <form method="post" class="stack">
        <label>Identifiant <input name="username" autocomplete="username" required></label>
        <label>Mot de passe <input name="password" type="password" autocomplete="current-password" required></label>
        <button>Se connecter</button>
    </form>
    <p class="muted">Compte demo : admin / admin123. Changez-le avant tout usage reel.</p>
</section>
<%@ include file="layout/footer.jspf" %>
