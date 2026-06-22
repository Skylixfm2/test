package fr.opendata.service;

import fr.opendata.dao.PersonDao;
import fr.opendata.dao.PersonMatchDao;
import fr.opendata.model.Person;

import java.sql.SQLException;
import java.text.Normalizer;
import java.util.List;

public class MatchingService {
    private final PersonDao personDao = new PersonDao();
    private final PersonMatchDao matchDao = new PersonMatchDao();

    public int detect(double threshold) throws SQLException {
        List<Person> people = personDao.findAll();
        int created = 0;
        for (int i = 0; i < people.size(); i++) {
            for (int j = i + 1; j < people.size(); j++) {
                double score = score(people.get(i), people.get(j));
                if (score >= threshold) {
                    matchDao.upsert(people.get(i).id(), people.get(j).id(), score);
                    created++;
                }
            }
        }
        return created;
    }

    public double score(Person a, Person b) {
        double total = 0;
        total += similarity(a.lastName(), b.lastName()) * 30;
        total += similarity(a.firstName(), b.firstName()) * 25;
        total += similarity(a.address(), b.address()) * 20;
        total += similarity(a.city(), b.city()) * 15;
        total += exact(a.postalCode(), b.postalCode()) * 10;
        return Math.round(total * 100.0) / 100.0;
    }

    private static double exact(String a, String b) {
        return norm(a).equals(norm(b)) ? 1.0 : 0.0;
    }

    private static double similarity(String a, String b) {
        String x = norm(a);
        String y = norm(b);
        if (x.isEmpty() || y.isEmpty()) return 0;
        int distance = levenshtein(x, y);
        return 1.0 - ((double) distance / Math.max(x.length(), y.length()));
    }

    private static String norm(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value.toLowerCase().trim(), Normalizer.Form.NFD).replaceAll("\\p{M}", "").replaceAll("[^a-z0-9]", "");
    }

    private static int levenshtein(String a, String b) {
        int[] prev = new int[b.length() + 1];
        int[] curr = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) prev[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            curr[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                curr[j] = Math.min(Math.min(curr[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            int[] tmp = prev; prev = curr; curr = tmp;
        }
        return prev[b.length()];
    }
}
