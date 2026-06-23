package fr.opendata.web.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.opendata.dao.AddressDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;

@WebServlet("/api/address")
public class AddressApiServlet extends HttpServlet {
    private final AddressDao addressDao = new AddressDao();
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        try {
            mapper.writeValue(resp.getWriter(), addressDao.search(req.getParameter("address"), req.getParameter("postalCode"), 20));
        } catch (SQLException ex) {
            throw new ServletException(ex);
        }
    }
}
