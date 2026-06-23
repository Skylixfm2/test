package fr.opendata.service;

import fr.opendata.dao.AddressDao;
import fr.opendata.dao.CompanyDao;
import fr.opendata.dao.DashboardDao;
import fr.opendata.model.Address;
import fr.opendata.model.Company;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.List;

public class DemoDataService {
    private final AddressDao addressDao = new AddressDao();
    private final CompanyDao companyDao = new CompanyDao();
    private final DashboardDao dashboardDao = new DashboardDao();

    public int generate() throws SQLException {
        List<Address> addresses = List.of(
                new Address(0, "10 rue de Rivoli", "75004", "Paris", "Paris", "Ile-de-France", new BigDecimal("48.8552500"), new BigDecimal("2.3609800"), "demo"),
                new Address(0, "20 avenue Tony Garnier", "69007", "Lyon", "Rhone", "Auvergne-Rhone-Alpes", new BigDecimal("45.7295000"), new BigDecimal("4.8313000"), "demo"),
                new Address(0, "1 place de la Bourse", "33000", "Bordeaux", "Gironde", "Nouvelle-Aquitaine", new BigDecimal("44.8412000"), new BigDecimal("-0.5699000"), "demo")
        );
        String[][] companies = {
                {"552100554", "55210055400013", "Open Demo Paris Services", "SAS", "6201Z"},
                {"130025265", "13002526500013", "Atelier Public Lyon Donnees", "Association", "9499Z"},
                {"356000000", "35600000000044", "Bordeaux Data Cooperative", "SCOP", "6311Z"}
        };
        for (int i = 0; i < addresses.size(); i++) {
            long addressId = addressDao.upsert(addresses.get(i));
            companyDao.save(new Company(0, companies[i][0], companies[i][1], companies[i][2], companies[i][3], companies[i][4], null, "demo"), addressId);
        }
        dashboardDao.logImport("Generation demo", null, "DEMO", companies.length + addresses.size(), "SUCCESS", "Donnees de demonstration regenerees.");
        return companies.length + addresses.size();
    }
}
