package fr.opendata.web;

import fr.opendata.model.Admin;
import fr.opendata.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;
import java.util.Optional;

@WebServlet("/login")
public class LoginServlet extends HttpServlet {
    private final AuthService authService = new AuthService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.getRequestDispatcher("/WEB-INF/views/login.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            Optional<Admin> admin = authService.authenticate(req.getParameter("username"), req.getParameter("password"));
            if (admin.isPresent()) {
                req.getSession(true).setAttribute("admin", admin.get());
                resp.sendRedirect(req.getContextPath() + "/admin/dashboard");
                return;
            }
            req.setAttribute("error", "Identifiants invalides.");
            doGet(req, resp);
        } catch (SQLException ex) {
            throw new ServletException(ex);
        }
    }
}
