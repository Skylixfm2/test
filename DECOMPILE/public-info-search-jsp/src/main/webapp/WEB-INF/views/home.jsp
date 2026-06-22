<%@ include file="layout/header.jspf" %>
<section class="hero">
    <div>
        <p class="eyebrow">Open data uniquement</p>
        <h1>Moteur local de recherche de personnes fictives.</h1>
        <p>Recherchez des fiches de demonstration stockees dans MySQL, sans scraping internet et dans un cadre RGPD.</p>
        <form class="quick-search" action="${pageContext.request.contextPath}/people">
            <input name="q" data-person-autocomplete placeholder="Nom, prenom, ville, fonction ou societe">
            <button>Rechercher</button>
        </form>
    </div>
    <aside class="hero-panel">
        <strong>Sources conseillees</strong>
        <span>MySQL local</span>
        <span>Donnees fictives</span>
        <span>Servlets + DAO</span>
        <span>JSP MVC</span>
    </aside>
</section>
<section class="band">
    <h2>Capacites principales</h2>
    <div class="grid">
        <article><h3>Recherche multicritere</h3><p>Nom, SIREN/SIRET, ville, code postal, adresse et pagination.</p></article>
        <article><h3>Imports controles</h3><p>CSV/JSON locaux ou URLs publiques autorisees, historisees dans le dashboard.</p></article>
        <article><h3>API REST</h3><p>Endpoints JSON pour brancher un frontend externe ou automatiser les recherches.</p></article>
    </div>
</section>
<%@ include file="layout/footer.jspf" %>
