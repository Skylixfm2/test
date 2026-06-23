<%@ include file="layout/header.jspf" %>
<section class="toolbar">
    <div>
        <p class="eyebrow">Donnees fictives locales</p>
        <h1>Recherche de personnes</h1>
    </div>
</section>

<form class="filters people-filters" method="get">
    <input name="q" value="${criteria.q}" data-person-autocomplete placeholder="Recherche rapide">
    <input name="lastName" value="${criteria.lastName}" placeholder="Nom">
    <input name="firstName" value="${criteria.firstName}" placeholder="Prenom">
    <input name="address" value="${criteria.address}" placeholder="Adresse">
    <input name="postalCode" value="${criteria.postalCode}" placeholder="Code postal">
    <select name="gender">
        <option value="">Genre</option>
        <option value="F" ${criteria.gender == 'F' ? 'selected' : ''}>F</option>
        <option value="M" ${criteria.gender == 'M' ? 'selected' : ''}>M</option>
        <option value="Autre" ${criteria.gender == 'Autre' ? 'selected' : ''}>Autre</option>
    </select>
    <input name="city" value="${criteria.city}" placeholder="Ville">
    <input name="role" value="${criteria.role}" placeholder="Fonction">
    <input name="company" value="${criteria.company}" placeholder="Societe">
    <select name="sort">
        <option value="last_name">Tri: nom</option>
        <option value="first_name" ${criteria.sort == 'first_name' ? 'selected' : ''}>Tri: prenom</option>
        <option value="birth_date" ${criteria.sort == 'birth_date' ? 'selected' : ''}>Tri: naissance</option>
        <option value="city" ${criteria.sort == 'city' ? 'selected' : ''}>Tri: ville</option>
        <option value="company" ${criteria.sort == 'company' ? 'selected' : ''}>Tri: societe</option>
    </select>
    <select name="dir">
        <option value="asc">Asc</option>
        <option value="desc" ${criteria.dir == 'desc' ? 'selected' : ''}>Desc</option>
    </select>
    <button>Rechercher</button>
</form>

<p class="muted">${total} resultat(s)</p>
<div class="table-wrap">
    <table>
        <thead>
        <tr><th>Nom</th><th>Prenom</th><th>Genre</th><th>Naissance</th><th>Adresse</th><th>Code postal</th><th>Ville</th><th>Fonction</th><th>Societe</th><th></th></tr>
        </thead>
        <tbody>
        <c:forEach items="${people}" var="person">
            <tr>
                <td>${person.lastName()}</td>
                <td>${person.firstName()}</td>
                <td>${person.gender()}</td>
                <td>${person.birthDate()}</td>
                <td>${person.address()}</td>
                <td>${person.postalCode()}</td>
                <td>${person.city()}</td>
                <td>${person.role()}</td>
                <td>${person.company()}</td>
                <td><a class="button ghost" href="${pageContext.request.contextPath}/person?id=${person.id()}">Detail</a></td>
            </tr>
        </c:forEach>
        </tbody>
    </table>
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

<section class="notice">
    <strong>RGPD</strong>
    <p>Ce moteur utilise uniquement des donnees fictives locales ou des donnees publiques autorisees. Aucun scraping internet et aucune donnee personnelle sensible.</p>
</section>
<%@ include file="layout/footer.jspf" %>
