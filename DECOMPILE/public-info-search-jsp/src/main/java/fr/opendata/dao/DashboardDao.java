package fr.opendata.dao;

import fr.opendata.config.Database;
import fr.opendata.model.ImportLog;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DashboardDao {
    public Map<String, Long> stats() throws SQLException {
        Map<String, Long> stats = new HashMap<>();
        stats.put("companies", count("companies"));
        stats.put("addresses", count("addresses"));
        stats.put("imports", count("imports"));
        return stats;
    }

    public List<ImportLog> recentImports() throws SQLException {
        String sql = "SELECT * FROM imports ORDER BY created_at DESC LIMIT 10";
        try (Connection con = Database.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            List<ImportLog> logs = new ArrayList<>();
            while (rs.next()) {
                logs.add(new ImportLog(rs.getLong("id"), rs.getString("source_name"), rs.getString("source_url"),
                        rs.getString("format"), rs.getInt("imported_rows"), rs.getString("status"),
                        rs.getString("message"), rs.getTimestamp("created_at").toLocalDateTime()));
            }
            return logs;
        }
    }

    public void logImport(String source, String url, String format, int rows, String status, String message) throws SQLException {
        String sql = "INSERT INTO imports(source_name, source_url, format, imported_rows, status, message) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection con = Database.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, source);
            ps.setString(2, url);
            ps.setString(3, format);
            ps.setInt(4, rows);
            ps.setString(5, status);
            ps.setString(6, message);
            ps.executeUpdate();
        }
    }

    private long count(String table) throws SQLException {
        try (Connection con = Database.getConnection();
             PreparedStatement ps = con.prepareStatement("SELECT COUNT(*) FROM " + table);
             ResultSet rs = ps.executeQuery()) {
            rs.next();
            return rs.getLong(1);
        }
    }
}
