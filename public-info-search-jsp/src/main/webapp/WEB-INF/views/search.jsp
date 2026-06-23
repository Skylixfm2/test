<%@ include file="layout/header.jspf" %>
<section class="toolbar">
    <h1>Recherche</h1>
    <a class="button ghost" href="${pageContext.request.contextPath}/admin/companies">Ajouter une fiche</a>
</section>
<form class="filters" method="get">
    <input name="q" value="${criteria.q}" data-autocomplete placeholder="Recherche rapide">
    <input name="name" value="${criteria.name}" placeholder="Nom d'entreprise">
    <input name="sirenOrSiret" value="${criteria.sirenOrSiret}" placeholder="SIREN ou SIRET">
    <input name="city" value="${criteria.city}" placeholder="Ville">
    <input name="postalCode" value="${criteria.postalCode}" placeholder="Code postal">
    <input name="address" value="${criteria.address}" placeholder="Adresse">
    <button>Filtrer</button>
</form>
<p class="muted">${total} resultat(s)</p>
<div class="results">
    <c:forEach items="${companies}" var="company">
        <article class="result-card">
            <div>
                <h2>${company.name()}</h2>
                <p>SIREN ${company.siren()} - SIRET ${company.siret()}</p>
                <c:if test="${not empty company.address()}">
                    <p>${company.address().line1()}, ${company.address().postalCode()} ${company.address().city()}</p>
                </c:if>
            </div>
            <a class="button" href="${pageContext.request.contextPath}/company?id=${company.id()}">Detail</a>
        </article>
    </c:forEach>
</div>
<div class="pagination">
    <c:if test="${criteria.page > 1}">
        <a class="button ghost" href="?q=${criteria.q}&page=${criteria.page - 1}">Precedent</a>
    </c:if>
    <span>Page ${criteria.page}</span>
    <c:if test="${total > criteria.page * criteria.pageSize}">
        <a class="button ghost" href="?q=${criteria.q}&page=${criteria.page + 1}">Suivant</a>
    </c:if>
</div>
<%@ include file="layout/footer.jspf" %>
