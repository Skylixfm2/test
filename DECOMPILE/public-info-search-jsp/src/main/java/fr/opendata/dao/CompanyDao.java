package fr.opendata.dao;

import fr.opendata.config.Database;
import fr.opendata.model.Address;
import fr.opendata.model.Company;
import fr.opendata.model.SearchCriteria;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class CompanyDao {
    public List<Company> search(SearchCriteria c) throws SQLException {
        Query query = buildSearch(c, false);
        try (Connection con = Database.getConnection();
             PreparedStatement ps = con.prepareStatement(query.sql + " ORDER BY co.name LIMIT ? OFFSET ?")) {
            bind(ps, query.params);
            ps.setInt(query.params.size() + 1, c.getPageSize());
            ps.setInt(query.params.size() + 2, c.offset());
            try (ResultSet rs = ps.executeQuery()) {
                List<Company> companies = new ArrayList<>();
                while (rs.next()) companies.add(map(rs));
                return companies;
            }
        }
    }

    public int count(SearchCriteria c) throws SQLException {
        Query query = buildSearch(c, true);
        try (Connection con = Database.getConnection();
             PreparedStatement ps = con.prepareStatement(query.sql)) {
            bind(ps, query.params);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }

    public Optional<Company> find(long id) throws SQLException {
        String sql = baseSelect() + " WHERE co.id = ?";
        try (Connection con = Database.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    public void save(Company company, Long addressId) throws SQLException {
        String sql = """
                INSERT INTO companies(siren, siret, name, legal_category, activity_code, address_id, source)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE name=VALUES(name), legal_category=VALUES(legal_category),
                    activity_code=VALUES(activity_code), address_id=VALUES(address_id), updated_at=CURRENT_TIMESTAMP
                """;
        try (Connection con = Database.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, company.siren());
            ps.setString(2, company.siret());
            ps.setString(3, company.name());
            ps.setString(4, company.legalCategory());
            ps.setString(5, company.activityCode());
            if (addressId == null) ps.setNull(6, Types.BIGINT); else ps.setLong(6, addressId);
            ps.setString(7, company.source());
            ps.executeUpdate();
        }
    }

    public void delete(long id) throws SQLException {
        try (Connection con = Database.getConnection();
             PreparedStatement ps = con.prepareStatement("DELETE FROM companies WHERE id = ?")) {
            ps.setLong(1, id);
            ps.executeUpdate();
        }
    }

    public List<String> autocomplete(String term) throws SQLException {
        String sql = "SELECT name FROM companies WHERE name LIKE ? ORDER BY name LIMIT 10";
        try (Connection con = Database.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, term + "%");
            try (ResultSet rs = ps.executeQuery()) {
                List<String> names = new ArrayList<>();
                while (rs.next()) names.add(rs.getString(1));
                return names;
            }
        }
    }

    public long countAll() throws SQLException {
        try (Connection con = Database.getConnection();
             PreparedStatement ps = con.prepareStatement("SELECT COUNT(*) FROM companies");
             ResultSet rs = ps.executeQuery()) {
            rs.next();
            return rs.getLong(1);
        }
    }

    private Query buildSearch(SearchCriteria c, boolean count) {
        StringBuilder sql = new StringBuilder(count ? "SELECT COUNT(*) " : baseSelect());
        sql.append(" FROM companies co LEFT JOIN addresses a ON a.id = co.address_id WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (c.getQ() != null) {
            sql.append(" AND (co.name LIKE ? OR co.siren = ? OR co.siret = ? OR a.line1 LIKE ? OR a.city LIKE ?)");
            params.add("%" + c.getQ() + "%");
            params.add(c.getQ());
            params.add(c.getQ());
            params.add("%" + c.getQ() + "%");
            params.add("%" + c.getQ() + "%");
        }
        if (c.getName() != null) {
            sql.append(" AND co.name LIKE ?");
            params.add("%" + c.getName() + "%");
        }
        if (c.getSirenOrSiret() != null) {
            sql.append(" AND (co.siren = ? OR co.siret = ?)");
            params.add(c.getSirenOrSiret());
            params.add(c.getSirenOrSiret());
        }
        if (c.getCity() != null) {
            sql.append(" AND a.city LIKE ?");
            params.add("%" + c.getCity() + "%");
        }
        if (c.getPostalCode() != null) {
            sql.append(" AND a.postal_code = ?");
            params.add(c.getPostalCode());
        }
        if (c.getAddress() != null) {
            sql.append(" AND a.line1 LIKE ?");
            params.add("%" + c.getAddress() + "%");
        }
        return new Query(sql.toString(), params);
    }

    private static String baseSelect() {
        return """
                SELECT co.id, co.siren, co.siret, co.name, co.legal_category, co.activity_code, co.source,
                       a.id address_id, a.line1, a.postal_code, a.city, a.department, a.region, a.latitude, a.longitude, a.source address_source
                """;
    }

    private static void bind(PreparedStatement ps, List<Object> params) throws SQLException {
        for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
    }

    private static Company map(ResultSet rs) throws SQLException {
        Address address = rs.getLong("address_id") == 0 ? null : new Address(
                rs.getLong("address_id"), rs.getString("line1"), rs.getString("postal_code"),
                rs.getString("city"), rs.getString("department"), rs.getString("region"),
                rs.getBigDecimal("latitude"), rs.getBigDecimal("longitude"), rs.getString("address_source"));
        return new Company(rs.getLong("id"), rs.getString("siren"), rs.getString("siret"), rs.getString("name"),
                rs.getString("legal_category"), rs.getString("activity_code"), address, rs.getString("source"));
    }

    private record Query(String sql, List<Object> params) {
    }
}
