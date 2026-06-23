package fr.opendata.web;

import fr.opendata.dao.PersonDao;
import fr.opendata.model.PersonSearchCriteria;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;

@WebServlet("/people")
public class PeopleServlet extends HttpServlet {
    private final PersonDao personDao = new PersonDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        PersonSearchCriteria criteria = criteria(req);
        try {
            req.setAttribute("people", personDao.search(criteria));
            req.setAttribute("total", personDao.count(criteria));
            req.setAttribute("criteria", criteria);
            req.getRequestDispatcher("/WEB-INF/views/people.jsp").forward(req, resp);
        } catch (SQLException ex) {
            throw new ServletException(ex);
        }
    }

    public static PersonSearchCriteria criteria(HttpServletRequest req) {
        PersonSearchCriteria c = new PersonSearchCriteria();
        c.setQ(req.getParameter("q"));
        c.setLastName(req.getParameter("lastName"));
        c.setFirstName(req.getParameter("firstName"));
        c.setGender(req.getParameter("gender"));
        c.setAddress(req.getParameter("address"));
        c.setPostalCode(req.getParameter("postalCode"));
        c.setCity(req.getParameter("city"));
        c.setRole(req.getParameter("role"));
        c.setCompany(req.getParameter("company"));
        c.setSort(req.getParameter("sort"));
        c.setDir(req.getParameter("dir"));
        c.setPage(parse(req.getParameter("page"), 1));
        c.setPageSize(parse(req.getParameter("pageSize"), 20));
        return c;
    }

    private static int parse(String value, int fallback) {
        try { return value == null ? fallback : Integer.parseInt(value); } catch (NumberFormatException ex) { return fallback; }
    }
}
