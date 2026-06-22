<%@ include file="layout/header.jspf" %>
<section class="detail">
    <a href="${pageContext.request.contextPath}/search">Retour</a>
    <h1>${company.name()}</h1>
    <dl>
        <dt>SIREN</dt><dd>${company.siren()}</dd>
        <dt>SIRET</dt><dd>${company.siret()}</dd>
        <dt>Categorie</dt><dd>${company.legalCategory()}</dd>
        <dt>Activite</dt><dd>${company.activityCode()}</dd>
        <dt>Source</dt><dd>${company.source()}</dd>
    </dl>
    <c:if test="${not empty company.address()}">
        <h2>Adresse publique associee</h2>
        <dl>
            <dt>Adresse</dt><dd>${company.address().line1()}</dd>
            <dt>Commune</dt><dd>${company.address().city()}</dd>
            <dt>Code postal</dt><dd>${company.address().postalCode()}</dd>
            <dt>Departement</dt><dd>${company.address().department()}</dd>
            <dt>Region</dt><dd>${company.address().region()}</dd>
            <dt>GPS</dt><dd>${company.address().latitude()}, ${company.address().longitude()}</dd>
        </dl>
    </c:if>
</section>
<%@ include file="layout/footer.jspf" %>
