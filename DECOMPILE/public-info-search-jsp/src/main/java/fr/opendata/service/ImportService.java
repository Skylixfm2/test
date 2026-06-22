package fr.opendata.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import fr.opendata.dao.AddressDao;
import fr.opendata.dao.CompanyDao;
import fr.opendata.dao.DashboardDao;
import fr.opendata.model.Address;
import fr.opendata.model.Company;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.Locale;

public class ImportService {
    private final AddressDao addressDao = new AddressDao();
    private final CompanyDao companyDao = new CompanyDao();
    private final DashboardDao dashboardDao = new DashboardDao();
    private final ObjectMapper mapper = new ObjectMapper();

    public int importCsv(InputStream input, String sourceName, String sourceUrl) throws IOException, SQLException {
        int count = 0;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8));
             CSVParser parser = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setTrim(true).build().parse(reader)) {
            for (CSVRecord row : parser) {
                importRow(value(row, "siren"), value(row, "siret"), value(row, "name", "nom", "denomination"),
                        value(row, "legal_category", "categorie_juridique"), value(row, "activity_code", "ape", "naf"),
                        value(row, "address", "adresse"), value(row, "postal_code", "code_postal"), value(row, "city", "ville", "commune"),
                        value(row, "department", "departement"), value(row, "region"), value(row, "latitude"), value(row, "longitude"),
                        sourceName);
                count++;
            }
        }
        dashboardDao.logImport(sourceName, sourceUrl, "CSV", count, "SUCCESS", "Import CSV termine.");
        return count;
    }

    public int importJson(InputStream input, String sourceName, String sourceUrl) throws IOException, SQLException {
        JsonNode root = mapper.readTree(input);
        JsonNode rows = root.isArray() ? root : root.path("records");
        int count = 0;
        for (JsonNode row : rows) {
            JsonNode data = row.has("fields") ? row.path("fields") : row;
            importRow(text(data, "siren"), text(data, "siret"), firstText(data, "name", "nom", "denomination"),
                    firstText(data, "legal_category", "categorie_juridique"), firstText(data, "activity_code", "ape", "naf"),
                    firstText(data, "address", "adresse"), firstText(data, "postal_code", "code_postal"), firstText(data, "city", "ville", "commune"),
                    firstText(data, "department", "departement"), text(data, "region"), text(data, "latitude"), text(data, "longitude"),
                    sourceName);
            count++;
        }
        dashboardDao.logImport(sourceName, sourceUrl, "JSON", count, "SUCCESS", "Import JSON termine.");
        return count;
    }

    public InputStream openPublicUrl(String url) throws IOException {
        URI uri = URI.create(url);
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
        if (!uri.getScheme().startsWith("http") || !(host.endsWith("data.gouv.fr") || host.endsWith("insee.fr") || host.endsWith("kaggle.com") || host.endsWith("etalab.gouv.fr"))) {
            throw new IOException("URL refusee: utilisez une source publique autorisee.");
        }
        return uri.toURL().openStream();
    }

    private void importRow(String siren, String siret, String name, String legalCategory, String activityCode,
                           String line1, String postalCode, String city, String department, String region,
                           String lat, String lon, String source) throws SQLException {
        if (isBlank(siret) || isBlank(name)) return;
        Long addressId = null;
        if (!isBlank(line1) && !isBlank(postalCode) && !isBlank(city)) {
            addressId = addressDao.upsert(new Address(0, line1, postalCode, city, department, region, decimal(lat), decimal(lon), source));
        }
        String cleanSiren = isBlank(siren) && siret.length() >= 9 ? siret.substring(0, 9) : siren;
        companyDao.save(new Company(0, cleanSiren, siret, name, legalCategory, activityCode, null, source), addressId);
    }

    private static String value(CSVRecord row, String... names) {
        for (String name : names) if (row.isMapped(name)) return row.get(name);
        return null;
    }

    private static String text(JsonNode node, String name) {
        JsonNode value = node.path(name);
        return value.isMissingNode() || value.isNull() ? null : value.asText();
    }

    private static String firstText(JsonNode node, String... names) {
        for (String name : names) {
            String value = text(node, name);
            if (!isBlank(value)) return value;
        }
        return null;
    }

    private static BigDecimal decimal(String value) {
        if (isBlank(value)) return null;
        try {
            return new BigDecimal(value.replace(',', '.'));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
