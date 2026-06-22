package fr.opendata.web;

import fr.opendata.service.DemoDataService;
import fr.opendata.service.ImportService;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.InputStream;

@WebServlet("/admin/imports")
@MultipartConfig(maxFileSize = 50_000_000)
public class AdminImportServlet extends HttpServlet {
    private final ImportService importService = new ImportService();
    private final DemoDataService demoDataService = new DemoDataService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String type = req.getParameter("type");
        String source = req.getParameter("sourceName") == null ? "import-admin" : req.getParameter("sourceName");
        try {
            int rows;
            if ("demo".equals(type)) {
                rows = demoDataService.generate();
            } else {
                String url = req.getParameter("sourceUrl");
                Part file = req.getPart("file");
                InputStream input = url != null && !url.isBlank() ? importService.openPublicUrl(url) : file.getInputStream();
                if ("json".equals(type)) rows = importService.importJson(input, source, url);
                else rows = importService.importCsv(input, source, url);
            }
            req.getSession().setAttribute("flash", rows + " lignes traitees.");
            resp.sendRedirect(req.getContextPath() + "/admin/dashboard");
        } catch (Exception ex) {
            throw new ServletException(ex);
        }
    }
}
