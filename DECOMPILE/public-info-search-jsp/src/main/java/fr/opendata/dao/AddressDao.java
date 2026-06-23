package fr.opendata.dao;

import fr.opendata.config.Database;
import fr.opendata.model.Address;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AddressDao {
    public long upsert(Address address) throws SQLException {
        String select = "SELECT id FROM addresses WHERE line1 = ? AND postal_code = ? AND city = ? LIMIT 1";
        try (Connection con = Database.getConnection();
             PreparedStatement find = con.prepareStatement(select)) {
            find.setString(1, address.line1());
            find.setString(2, address.postalCode());
            find.setString(3, address.city());
            try (ResultSet rs = find.executeQuery()) {
                if (rs.next()) return rs.getLong(1);
            }
        }
        String insert = """
                INSERT INTO addresses(line1, postal_code, city, department, region, latitude, longitude, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """;
        try (Connection con = Database.getConnection();
             PreparedStatement ps = con.prepareStatement(insert, Statement.RETURN_GENERATED_KEYS)) {
            bind(ps, address);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                keys.next();
                return keys.getLong(1);
            }
        }
    }

    public List<Address> search(String address, String postalCode, int limit) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT * FROM addresses WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (address != null && !address.isBlank()) {
            sql.append(" AND (line1 LIKE ? OR city LIKE ?)");
            params.add("%" + address.trim() + "%");
            params.add("%" + address.trim() + "%");
        }
        if (postalCode != null && !postalCode.isBlank()) {
            sql.append(" AND postal_code = ?");
            params.add(postalCode.trim());
        }
        sql.append(" ORDER BY city, line1 LIMIT ?");
        params.add(limit);
        try (Connection con = Database.getConnection();
             PreparedStatement ps = con.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            try (ResultSet rs = ps.executeQuery()) {
                List<Address> result = new ArrayList<>();
                while (rs.next()) result.add(map(rs));
                return result;
            }
        }
    }

    static Address map(ResultSet rs) throws SQLException {
        return new Address(
                rs.getLong("id"),
                rs.getString("line1"),
                rs.getString("postal_code"),
                rs.getString("city"),
                rs.getString("department"),
                rs.getString("region"),
                rs.getBigDecimal("latitude"),
                rs.getBigDecimal("longitude"),
                rs.getString("source")
        );
    }

    private void bind(PreparedStatement ps, Address address) throws SQLException {
        ps.setString(1, address.line1());
        ps.setString(2, address.postalCode());
        ps.setString(3, address.city());
        ps.setString(4, address.department());
        ps.setString(5, address.region());
        ps.setBigDecimal(6, address.latitude());
        ps.setBigDecimal(7, address.longitude());
        ps.setString(8, address.source());
    }
}
