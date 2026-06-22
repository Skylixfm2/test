# Person Search JSP

Application MVC JSP/Servlets pour rechercher des personnes dans une base MySQL locale contenant des donnees fictives de demonstration et, si vous le configurez, des imports issus de sources publiques explicitement autorisees.

## Cadre RGPD

- Pas de scraping libre de donnees personnelles.
- Les collectes sont limitees a des domaines allowlist, autorises par `robots.txt`, avec rate limit.
- Les imports attendent un JSON public structure. Les pages HTML de particuliers, hopitaux, annuaires ou administrations ne sont pas aspirees automatiquement.
- Aucun email, telephone, adresse privee ou identifiant sensible reel.
- Les profils fournis dans `database/demo-data.sql` sont fictifs.

## Fonctionnalites

- Barre de recherche rapide par nom/prenom avec autocompletion.
- Recherche multicritere : nom, prenom, genre, adresse, code postal, ville, fonction, societe.
- Filtres avances et tri des resultats.
- Pagination des resultats.
- Tableau moderne de resultats.
- Fiche detaillee d'une personne : nom, prenom, genre, date de naissance, ville, fonction, societe.
- Backend Java Servlets + DAO + MVC.
- Base MySQL avec donnees fictives generees dans les scripts SQL.
- Requetes SQL securisees avec `PreparedStatement`.
- Module de collecte autorisee : allowlist, robots.txt, rate limiter, stockage en MySQL.
- Module de matching : score de similarite 0 a 100 base sur nom, prenom, adresse, ville, code postal.
- Fusion manuelle de deux entrees avec conservation des libelles de sources.

## Arborescence principale

```text
public-info-search-jsp/
  pom.xml
  database/
    schema.sql
    demo-data.sql
  src/main/java/fr/opendata/
    config/Database.java
    dao/PersonDao.java
    dao/PersonMatchDao.java
    model/Person.java
    model/PersonMatch.java
    model/PersonSearchCriteria.java
    service/ScrapeService.java
    service/RobotsTxtService.java
    service/RateLimiter.java
    service/MatchingService.java
    web/AdminScrapeServlet.java
    web/AdminMatchingServlet.java
    web/PeopleServlet.java
    web/PersonDetailServlet.java
    web/api/PersonAutocompleteApiServlet.java
  src/main/webapp/
    assets/css/app.css
    assets/js/app.js
    WEB-INF/views/people.jsp
    WEB-INF/views/person-detail.jsp
```

## Installation locale

1. Installer Java 17, Maven 3.9+, MySQL 8 et Tomcat 10.1.
2. Creer la base :

```sql
CREATE DATABASE public_info_search CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'openuser'@'localhost' IDENTIFIED BY 'openpass';
GRANT ALL PRIVILEGES ON public_info_search.* TO 'openuser'@'localhost';
FLUSH PRIVILEGES;
```

3. Importer les scripts :

```bash
mysql -u openuser -p public_info_search < database/schema.sql
mysql -u openuser -p public_info_search < database/demo-data.sql
```

4. Configurer Tomcat :

```bash
DB_URL=jdbc:mysql://localhost:3306/public_info_search?useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC
DB_USER=openuser
DB_PASSWORD=openpass
SCRAPER_ALLOWED_HOSTS=www.data.gouv.fr,example.org
```

5. Construire et deployer :

```bash
mvn clean package
copy target/public-info-search.war %CATALINA_HOME%\webapps\
```

6. Ouvrir :

```text
http://localhost:8080/public-info-search/people
```

## Endpoints

- `GET /people` : page JSP de recherche.
- `GET /person?id=1` : fiche detaillee.
- `GET /api/people/autocomplete?q=cam` : autocompletion JSON.
- `POST /api/auth/send-code` : envoie un code email ou SMS.
- `POST /api/auth/verify-code` : verifie un code email ou SMS.
- `POST /admin/scrape` : collecte JSON autorisee depuis un domaine allowlist.
- `POST /admin/matching` : detection de doublons ou fusion manuelle.

## Verification email + telephone

Le frontend appelle par defaut `/api/auth/send-code` et `/api/auth/verify-code`.
Si les pages HTML sont hebergees ailleurs que le WAR Java, configure l'URL API dans le navigateur :

```js
localStorage.setItem("lusive-auth-api-base", "https://ton-domaine.fr/public-info-search/api/auth");
```

Variables d'environnement pour l'email SMTP :

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tonadresse@gmail.com
SMTP_PASSWORD=mot_de_passe_application_google
SMTP_FROM=tonadresse@gmail.com
SMTP_STARTTLS=true
AUTH_CORS_ORIGIN=https://ton-site.fr
```

Pour Gmail, utilise un mot de passe d'application Google, pas ton mot de passe normal.

Variables d'environnement pour SMS Twilio :

```bash
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM=+1234567890
```

Si `SMTP_HOST` ou `SMS_PROVIDER=twilio` ne sont pas configures, les codes sont seulement affiches dans les logs serveur pour tester localement.

## Format JSON attendu pour la collecte

La collecte autorisee importe soit un tableau JSON, soit un objet `{ "people": [...] }`.

```json
[
  {
    "lastName": "Morel",
    "firstName": "Camille",
    "gender": "F",
    "birthDate": "1994-03-18",
    "address": "12 rue des Erables",
    "postalCode": "44000",
    "city": "Nantes",
    "role": "Chargee de projet",
    "company": "Atelier Vert"
  }
]
```

## Matching

Le score est calcule ainsi :

- nom : 30 points
- prenom : 25 points
- adresse : 20 points
- ville : 15 points
- code postal exact : 10 points

Le dashboard admin permet de lancer une detection avec un seuil, puis de fusionner deux IDs. La fusion conserve l'entree choisie et concatene les libelles de sources.
