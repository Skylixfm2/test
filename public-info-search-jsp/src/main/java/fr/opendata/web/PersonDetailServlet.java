package fr.opendata.web;

import fr.opendata.dao.PersonDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;

@WebServlet("/person")
public class PersonDetailServlet extends HttpServlet {
    private final PersonDao personDao = new PersonDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            long id = Long.parseLong(req.getParameter("id"));
            req.setAttribute("person", personDao.find(id).orElseThrow());
            req.getRequestDispatcher("/WEB-INF/views/person-detail.jsp").forward(req, resp);
        } catch (SQLException | RuntimeException ex) {
            throw new ServletException(ex);
        }
    }
}
