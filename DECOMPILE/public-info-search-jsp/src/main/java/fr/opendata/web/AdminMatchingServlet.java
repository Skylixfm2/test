package fr.opendata.web;

import fr.opendata.dao.PersonDao;
import fr.opendata.service.MatchingService;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;

@WebServlet("/admin/matching")
public class AdminMatchingServlet extends HttpServlet {
    private final MatchingService matchingService = new MatchingService();
    private final PersonDao personDao = new PersonDao();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            if ("merge".equals(req.getParameter("action"))) {
                personDao.merge(Long.parseLong(req.getParameter("keepId")), Long.parseLong(req.getParameter("removeId")));
                req.getSession().setAttribute("flash", "Fusion effectuee.");
            } else {
                double threshold = parse(req.getParameter("threshold"), 80);
                int count = matchingService.detect(threshold);
                req.getSession().setAttribute("flash", count + " suggestion(s) de doublon detectee(s).");
            }
            resp.sendRedirect(req.getContextPath() + "/admin/dashboard");
        } catch (SQLException ex) {
            throw new ServletException(ex);
        }
    }

    private static double parse(String value, double fallback) {
        try { return value == null ? fallback : Double.parseDouble(value); } catch (NumberFormatException ex) { return fallback; }
    }
}
