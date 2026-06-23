package fr.opendata.web;

import fr.opendata.dao.CompanyDao;
import fr.opendata.model.SearchCriteria;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;

@WebServlet("/search")
public class SearchServlet extends HttpServlet {
    private final CompanyDao companyDao = new CompanyDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        SearchCriteria c = criteria(req);
        try {
            req.setAttribute("companies", companyDao.search(c));
            req.setAttribute("total", companyDao.count(c));
            req.setAttribute("criteria", c);
            req.getRequestDispatcher("/WEB-INF/views/search.jsp").forward(req, resp);
        } catch (SQLException ex) {
            throw new ServletException(ex);
        }
    }

    public static SearchCriteria criteria(HttpServletRequest req) {
        SearchCriteria c = new SearchCriteria();
        c.setQ(req.getParameter("q"));
        c.setName(req.getParameter("name"));
        c.setSirenOrSiret(req.getParameter("sirenOrSiret"));
        c.setCity(req.getParameter("city"));
        c.setPostalCode(req.getParameter("postalCode"));
        c.setAddress(req.getParameter("address"));
        c.setPage(parse(req.getParameter("page"), 1));
        c.setPageSize(parse(req.getParameter("pageSize"), 20));
        return c;
    }

    private static int parse(String value, int fallback) {
        try { return value == null ? fallback : Integer.parseInt(value); } catch (NumberFormatException ex) { return fallback; }
    }
}
