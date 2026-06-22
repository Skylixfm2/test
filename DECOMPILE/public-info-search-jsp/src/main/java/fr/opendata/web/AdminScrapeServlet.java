package fr.opendata.web;

import fr.opendata.service.ScrapeService;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.net.URI;

@WebServlet("/admin/scrape")
public class AdminScrapeServlet extends HttpServlet {
    private final ScrapeService scrapeService = new ScrapeService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            URI uri = URI.create(req.getParameter("url"));
            String source = req.getParameter("sourceLabel") == null ? uri.getHost() : req.getParameter("sourceLabel");
            long delay = parse(req.getParameter("delayMs"), 3000);
            int rows = scrapeService.importAuthorizedJson(uri, source, delay);
            req.getSession().setAttribute("flash", rows + " ligne(s) importee(s) depuis une source autorisee.");
            resp.sendRedirect(req.getContextPath() + "/admin/dashboard");
        } catch (Exception ex) {
            req.getSession().setAttribute("flash", "Collecte refusee: " + ex.getMessage());
            resp.sendRedirect(req.getContextPath() + "/admin/dashboard");
        }
    }

    private static long parse(String value, long fallback) {
        try { return value == null ? fallback : Long.parseLong(value); } catch (NumberFormatException ex) { return fallback; }
    }
}
