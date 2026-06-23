<%@ include file="layout/header.jspf" %>
<section class="detail">
    <a href="${pageContext.request.contextPath}/people">Retour</a>
    <h1>${person.displayName()}</h1>
    <dl>
        <dt>Nom</dt><dd>${person.lastName()}</dd>
        <dt>Prenom</dt><dd>${person.firstName()}</dd>
        <dt>Genre</dt><dd>${person.gender()}</dd>
        <dt>Date de naissance</dt><dd>${person.birthDate()}</dd>
        <dt>Adresse</dt><dd>${person.address()}</dd>
        <dt>Code postal</dt><dd>${person.postalCode()}</dd>
        <dt>Ville</dt><dd>${person.city()}</dd>
        <dt>Fonction</dt><dd>${person.role()}</dd>
        <dt>Societe</dt><dd>${person.company()}</dd>
        <dt>Sources</dt><dd>${person.sourceLabel()} (${person.sourceType()})</dd>
    </dl>
</section>
<%@ include file="layout/footer.jspf" %>
