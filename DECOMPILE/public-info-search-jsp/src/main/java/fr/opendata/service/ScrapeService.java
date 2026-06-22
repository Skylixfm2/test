package fr.opendata.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import fr.opendata.dao.PersonDao;
import fr.opendata.model.Person;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.Set;

public class ScrapeService {
    private final Set<String> allowedHosts = Set.of(System.getenv().getOrDefault("SCRAPER_ALLOWED_HOSTS", "www.data.gouv.fr").split(","));
    private final RobotsTxtService robotsTxtService = new RobotsTxtService();
    private final RateLimiter rateLimiter = new RateLimiter();
    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();
    private final PersonDao personDao = new PersonDao();

    public int importAuthorizedJson(URI uri, String sourceLabel, long delayMs) throws IOException, InterruptedException, SQLException {
        if (!allowedHosts.contains(uri.getHost())) throw new IOException("Host non autorise: " + uri.getHost());
        if (!robotsTxtService.allowed(uri)) throw new IOException("Bloque par robots.txt");
        rateLimiter.waitTurn(uri.getHost(), delayMs);
        HttpRequest request = HttpRequest.newBuilder(uri).header("User-Agent", "PublicInfoSearchBot/1.0 RGPD").GET().build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) throw new IOException("Source indisponible: HTTP " + response.statusCode());
        JsonNode root = mapper.readTree(response.body());
        JsonNode rows = root.isArray() ? root : root.path("people");
        int count = 0;
        for (JsonNode row : rows) {
            if (isBlank(row.path("lastName").asText(null)) || isBlank(row.path("firstName").asText(null))) continue;
            personDao.save(new Person(0, row.path("lastName").asText(), row.path("firstName").asText(),
                    row.path("gender").asText("Autre"), LocalDate.parse(row.path("birthDate").asText("1970-01-01")),
                    row.path("address").asText(null), row.path("postalCode").asText(null), row.path("city").asText("Non renseignee"),
                    row.path("role").asText("Non renseignee"), row.path("company").asText("Non renseignee"), sourceLabel, "SCRAPING"));
            count++;
        }
        return count;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
