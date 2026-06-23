package fr.opendata.web;

import fr.opendata.dao.AddressDao;
import fr.opendata.dao.CompanyDao;
import fr.opendata.model.Address;
import fr.opendata.model.Company;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;

@WebServlet("/admin/companies")
public class AdminCompanyServlet extends HttpServlet {
    private final CompanyDao companyDao = new CompanyDao();
    private final AddressDao addressDao = new AddressDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.getRequestDispatcher("/WEB-INF/views/admin/company-form.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            if ("delete".equals(req.getParameter("action"))) {
                companyDao.delete(Long.parseLong(req.getParameter("id")));
            } else {
                Long addressId = addressDao.upsert(new Address(0, req.getParameter("line1"), req.getParameter("postalCode"), req.getParameter("city"),
                        req.getParameter("department"), req.getParameter("region"), null, null, "admin"));
                companyDao.save(new Company(0, req.getParameter("siren"), req.getParameter("siret"), req.getParameter("name"),
                        req.getParameter("legalCategory"), req.getParameter("activityCode"), null, "admin"), addressId);
            }
            resp.sendRedirect(req.getContextPath() + "/search");
        } catch (SQLException ex) {
            throw new ServletException(ex);
        }
    }
}
