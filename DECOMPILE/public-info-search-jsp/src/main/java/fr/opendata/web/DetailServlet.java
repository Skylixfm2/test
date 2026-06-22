package fr.opendata.web;

import fr.opendata.dao.CompanyDao;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;

@WebServlet("/company")
public class DetailServlet extends HttpServlet {
    private final CompanyDao companyDao = new CompanyDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            long id = Long.parseLong(req.getParameter("id"));
            req.setAttribute("company", companyDao.find(id).orElseThrow());
            req.getRequestDispatcher("/WEB-INF/views/detail.jsp").forward(req, resp);
        } catch (SQLException | RuntimeException ex) {
            throw new ServletException(ex);
        }
    }
}
