package fr.opendata.dao;

import fr.opendata.config.Database;
import fr.opendata.model.Person;
import fr.opendata.model.PersonSearchCriteria;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class PersonDao {
    public List<Person> search(PersonSearchCriteria c) throws SQLException {
        Query query = buildQuery(c, false);
        String sql = query.sql + " ORDER BY " + c.getSort() + " " + c.getDir() + " LIMIT ? OFFSET ?";
        try (Connection con = Database.getConnection(); PreparedStatement ps = con.prepareStatement(sql)) {
            bind(ps, query.params);
            ps.setInt(query.params.size() + 1, c.getPageSize());
            ps.setInt(query.params.size() + 2, c.offset());
            try (ResultSet rs = ps.executeQuery()) {
                List<Person> people = new ArrayList<>();
                while (rs.next()) people.add(map(rs));
                return people;
            }
        }
    }

    public int count(PersonSearchCriteria c) throws SQLException {
        Query query = buildQuery(c, true);
        try (Connection con = Database.getConnection(); PreparedStatement ps = con.prepareStatement(query.sql)) {
            bind(ps, query.params);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }

    public Optional<Person> find(long id) throws SQLException {
        try (Connection con = Database.getConnection();
             PreparedStatement ps = con.prepareStatement("SELECT * FROM people WHERE id = ?")) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }

    public List<String> autocomplete(String q) throws SQLException {
        String sql = """
                SELECT CONCAT(first_name, ' ', last_name) label
                FROM people
                WHERE first_name LIKE ? OR last_name LIKE ? OR CONCAT(first_name, ' ', last_name) LIKE ?
                ORDER BY last_name, first_name
                LIMIT 10
                """;
        try (Connection con = Database.getConnection(); PreparedStatement ps = con.prepareStatement(sql)) {
            String like = q + "%";
            ps.setString(1, like);
            ps.setString(2, like);
            ps.setString(3, "%" + q + "%");
            try (ResultSet rs = ps.executeQuery()) {
                List<String> labels = new ArrayList<>();
                while (rs.next()) labels.add(rs.getString("label"));
                return labels;
            }
        }
    }

    public List<Person> findAll() throws SQLException {
        try (Connection con = Database.getConnection();
             PreparedStatement ps = con.prepareStatement("SELECT * FROM people ORDER BY id");
             ResultSet rs = ps.executeQuery()) {
            List<Person> people = new ArrayList<>();
            while (rs.next()) people.add(map(rs));
            return people;
        }
    }

    public void save(Person person) throws SQLException {
        String sql = """
                INSERT INTO people(last_name, first_name, gender, birth_date, address, postal_code, city, role, company, source_label, source_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        try (Connection con = Database.getConnection(); PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, person.lastName());
            ps.setString(2, person.firstName());
            ps.setString(3, person.gender());
            ps.setDate(4, Date.valueOf(person.birthDate()));
            ps.setString(5, person.address());
            ps.setString(6, person.postalCode());
            ps.setString(7, person.city());
            ps.setString(8, person.role());
            ps.setString(9, person.company());
            ps.setString(10, person.sourceLabel());
            ps.setString(11, person.sourceType());
            ps.executeUpdate();
        }
    }

    public void merge(long keepId, long removeId) throws SQLException {
        try (Connection con = Database.getConnection()) {
            con.setAutoCommit(false);
            try (PreparedStatement update = con.prepareStatement("""
                    UPDATE people keep_row
                    JOIN people remove_row ON remove_row.id = ?
                    SET keep_row.address = COALESCE(NULLIF(keep_row.address, ''), remove_row.address),
                        keep_row.postal_code = COALESCE(NULLIF(keep_row.postal_code, ''), remove_row.postal_code),
                        keep_row.city = COALESCE(NULLIF(keep_row.city, ''), remove_row.city),
                        keep_row.role = COALESCE(NULLIF(keep_row.role, ''), remove_row.role),
                        keep_row.company = COALESCE(NULLIF(keep_row.company, ''), remove_row.company),
                        keep_row.source_label = CONCAT(keep_row.source_label, ', ', remove_row.source_label)
                    WHERE keep_row.id = ?
                    """);
                 PreparedStatement delete = con.prepareStatement("DELETE FROM people WHERE id = ?");
                 PreparedStatement mark = con.prepareStatement("UPDATE person_matches SET status = 'MERGED' WHERE left_person_id IN (?, ?) AND right_person_id IN (?, ?)")) {
                update.setLong(1, removeId);
                update.setLong(2, keepId);
                update.executeUpdate();
                delete.setLong(1, removeId);
                delete.executeUpdate();
                mark.setLong(1, keepId);
                mark.setLong(2, removeId);
                mark.setLong(3, keepId);
                mark.setLong(4, removeId);
                mark.executeUpdate();
                con.commit();
            } catch (SQLException ex) {
                con.rollback();
                throw ex;
            }
        }
    }

    private Query buildQuery(PersonSearchCriteria c, boolean count) {
        StringBuilder sql = new StringBuilder(count ? "SELECT COUNT(*) FROM people WHERE 1=1" : "SELECT * FROM people WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (c.getQ() != null) {
            sql.append(" AND (last_name LIKE ? OR first_name LIKE ? OR address LIKE ? OR postal_code LIKE ? OR city LIKE ? OR role LIKE ? OR company LIKE ?)");
            for (int i = 0; i < 7; i++) params.add("%" + c.getQ() + "%");
        }
        if (c.getLastName() != null) { sql.append(" AND last_name LIKE ?"); params.add("%" + c.getLastName() + "%"); }
        if (c.getFirstName() != null) { sql.append(" AND first_name LIKE ?"); params.add("%" + c.getFirstName() + "%"); }
        if (c.getGender() != null) { sql.append(" AND gender = ?"); params.add(c.getGender()); }
        if (c.getCity() != null) { sql.append(" AND city LIKE ?"); params.add("%" + c.getCity() + "%"); }
        if (c.getAddress() != null) { sql.append(" AND address LIKE ?"); params.add("%" + c.getAddress() + "%"); }
        if (c.getPostalCode() != null) { sql.append(" AND postal_code = ?"); params.add(c.getPostalCode()); }
        if (c.getRole() != null) { sql.append(" AND role LIKE ?"); params.add("%" + c.getRole() + "%"); }
        if (c.getCompany() != null) { sql.append(" AND company LIKE ?"); params.add("%" + c.getCompany() + "%"); }
        return new Query(sql.toString(), params);
    }

    private static void bind(PreparedStatement ps, List<Object> params) throws SQLException {
        for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
    }

    private static Person map(ResultSet rs) throws SQLException {
        return new Person(rs.getLong("id"), rs.getString("last_name"), rs.getString("first_name"),
                rs.getString("gender"), rs.getDate("birth_date").toLocalDate(), rs.getString("address"),
                rs.getString("postal_code"), rs.getString("city"), rs.getString("role"), rs.getString("company"),
                rs.getString("source_label"), rs.getString("source_type"));
    }

    private record Query(String sql, List<Object> params) {
    }
}
