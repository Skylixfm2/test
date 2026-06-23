package fr.opendata.dao;

import fr.opendata.config.Database;
import fr.opendata.model.Admin;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

public class AdminDao {
    public Optional<Admin> findByUsername(String username) throws SQLException {
        String sql = "SELECT id, username, password_hash FROM admins WHERE username = ?";
        try (Connection con = Database.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(new Admin(rs.getLong("id"), rs.getString("username"), rs.getString("password_hash")));
                }
            }
        }
        return Optional.empty();
    }
}
