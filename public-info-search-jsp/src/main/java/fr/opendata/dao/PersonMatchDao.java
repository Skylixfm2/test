package fr.opendata.dao;

import fr.opendata.config.Database;
import fr.opendata.model.PersonMatch;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class PersonMatchDao {
    public void upsert(long leftId, long rightId, double score) throws SQLException {
        long a = Math.min(leftId, rightId);
        long b = Math.max(leftId, rightId);
        String sql = """
                INSERT INTO person_matches(left_person_id, right_person_id, score)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE score = VALUES(score), status = 'SUGGESTED'
                """;
        try (Connection con = Database.getConnection(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setLong(1, a);
            ps.setLong(2, b);
            ps.setDouble(3, score);
            ps.executeUpdate();
        }
    }

    public List<PersonMatch> suggested() throws SQLException {
        try (Connection con = Database.getConnection();
             PreparedStatement ps = con.prepareStatement("SELECT * FROM person_matches WHERE status = 'SUGGESTED' ORDER BY score DESC");
             ResultSet rs = ps.executeQuery()) {
            List<PersonMatch> matches = new ArrayList<>();
            while (rs.next()) {
                matches.add(new PersonMatch(rs.getLong("id"), rs.getLong("left_person_id"), rs.getLong("right_person_id"), rs.getDouble("score"), rs.getString("status")));
            }
            return matches;
        }
    }
}
