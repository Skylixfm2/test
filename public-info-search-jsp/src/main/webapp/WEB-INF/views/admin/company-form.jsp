<%@ include file="../layout/header.jspf" %>
<section class="auth-panel wide">
    <h1>Ajouter ou mettre a jour une entreprise</h1>
    <form method="post" class="stack">
        <div class="two"><label>SIREN <input name="siren" maxlength="9" required></label><label>SIRET <input name="siret" maxlength="14" required></label></div>
        <label>Nom <input name="name" required></label>
        <div class="two"><label>Categorie <input name="legalCategory"></label><label>Code APE/NAF <input name="activityCode"></label></div>
        <label>Adresse <input name="line1" required></label>
        <div class="two"><label>Code postal <input name="postalCode" required></label><label>Ville <input name="city" required></label></div>
        <div class="two"><label>Departement <input name="department"></label><label>Region <input name="region"></label></div>
        <button>Enregistrer</button>
    </form>
</section>
<%@ include file="../layout/footer.jspf" %>
