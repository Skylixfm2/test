package fr.opendata.web.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.opendata.dao.CompanyDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;

@WebServlet("/api/autocomplete")
public class AutocompleteApiServlet extends HttpServlet {
    private final CompanyDao companyDao = new CompanyDao();
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        String q = req.getParameter("q");
        try {
            mapper.writeValue(resp.getWriter(), companyDao.autocomplete(q == null ? "" : q.trim()));
        } catch (SQLException ex) {
            throw new ServletException(ex);
        }
    }
}
