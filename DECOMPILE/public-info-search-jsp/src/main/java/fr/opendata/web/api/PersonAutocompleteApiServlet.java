package fr.opendata.web.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.opendata.dao.PersonDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;

@WebServlet("/api/people/autocomplete")
public class PersonAutocompleteApiServlet extends HttpServlet {
    private final PersonDao personDao = new PersonDao();
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        try {
            mapper.writeValue(resp.getWriter(), personDao.autocomplete(req.getParameter("q") == null ? "" : req.getParameter("q").trim()));
        } catch (SQLException ex) {
            throw new ServletException(ex);
        }
    }
}
