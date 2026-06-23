<%@ include file="../layout/header.jspf" %>
<section class="toolbar">
    <h1>Dashboard administrateur</h1>
    <a class="button" href="${pageContext.request.contextPath}/admin/companies">Nouvelle fiche</a>
</section>
<c:if test="${not empty sessionScope.flash}"><p class="success">${sessionScope.flash}</p><c:remove var="flash" scope="session"/></c:if>
<div class="stats">
    <article><strong>${stats.companies}</strong><span>Entreprises</span></article>
    <article><strong>${stats.addresses}</strong><span>Adresses</span></article>
    <article><strong>${stats.imports}</strong><span>Imports</span></article>
</div>
<section class="band">
    <h2>Importer des donnees publiques</h2>
    <form class="filters" method="post" action="${pageContext.request.contextPath}/admin/imports" enctype="multipart/form-data">
        <input name="sourceName" placeholder="Nom de source">
        <select name="type">
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="demo">Demo</option>
        </select>
        <input name="sourceUrl" placeholder="URL data.gouv.fr, insee.fr, etalab.gouv.fr, kaggle.com">
        <input type="file" name="file" accept=".csv,.json">
        <button>Importer</button>
    </form>
</section>
<section class="band">
    <h2>Collecte autorisee</h2>
    <p class="muted">Importe uniquement un JSON public au format attendu, depuis un domaine allowlist et autorise par robots.txt. Configurez `SCRAPER_ALLOWED_HOSTS` cote serveur.</p>
    <form class="filters" method="post" action="${pageContext.request.contextPath}/admin/scrape">
        <input name="sourceLabel" placeholder="Nom de source">
        <input name="url" placeholder="URL JSON autorisee">
        <input name="delayMs" type="number" value="3000" min="1000" step="500">
        <button>Collecter</button>
    </form>
</section>
<section class="band">
    <h2>Matching et fusion</h2>
    <form class="filters" method="post" action="${pageContext.request.contextPath}/admin/matching">
        <input name="threshold" type="number" value="80" min="0" max="100">
        <button>Detecter les doublons</button>
    </form>
    <form class="filters" method="post" action="${pageContext.request.contextPath}/admin/matching">
        <input type="hidden" name="action" value="merge">
        <input name="keepId" type="number" placeholder="ID a conserver">
        <input name="removeId" type="number" placeholder="ID a fusionner">
        <button>Fusionner</button>
    </form>
</section>
<section class="band">
    <h2>Historique</h2>
    <table>
        <thead><tr><th>Source</th><th>Format</th><th>Lignes</th><th>Statut</th><th>Date</th></tr></thead>
        <tbody>
        <c:forEach items="${imports}" var="log">
            <tr><td>${log.sourceName()}</td><td>${log.format()}</td><td>${log.importedRows()}</td><td>${log.status()}</td><td>${log.createdAt()}</td></tr>
        </c:forEach>
        </tbody>
    </table>
</section>
<%@ include file="../layout/footer.jspf" %>
