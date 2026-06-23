package fr.opendata.web.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.opendata.dao.CompanyDao;
import fr.opendata.web.SearchServlet;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;

@WebServlet("/api/search")
public class SearchApiServlet extends HttpServlet {
    private final CompanyDao companyDao = new CompanyDao();
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        try {
            mapper.writeValue(resp.getWriter(), companyDao.search(SearchServlet.criteria(req)));
        } catch (SQLException ex) {
            throw new ServletException(ex);
        }
    }
}
