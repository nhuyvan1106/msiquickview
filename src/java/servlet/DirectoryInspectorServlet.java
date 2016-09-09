package servlet;

import com.fasterxml.jackson.core.JsonGenerator;
import java.io.*;
import java.nio.file.*;
import java.util.Arrays;
import java.util.logging.*;
import javax.inject.Inject;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import json.JsonWriter;
import resource.ApplicationResource;

@WebServlet(name = "DirectoryInspectorServlet", urlPatterns = {"/DirectoryInspectorServlet/view-files", "/DirectoryInspectorServlet/load-more-images",
    "/DirectoryInspectorServlet/refresh"})
public class DirectoryInspectorServlet extends HttpServlet {

    @Inject
    private ApplicationResource resources;

    protected void processRequest(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        Path userDir = Paths.get(System.getProperty("user.home"), resources.getStorage(), request.getParameter("user-dir"));
        String datasetName = request.getParameter("dataset-name");
        Writer writer = response.getWriter();
        JsonGenerator generator = resources.getJsonFactory().createJsonGenerator(writer);
        switch (request.getServletPath()) {
            case "/DirectoryInspectorServlet/view-files":
                JsonWriter.writeUserDir(generator, userDir, datasetName);
                break;

            case "/DirectoryInspectorServlet/load-more-images":
                int skip = Integer.parseInt(request.getParameter("skip"));
                int limit = Integer.parseInt(request.getParameter("limit"));
                Path path = userDir.resolve(datasetName).resolve("images");
                File[] files = path.toFile().listFiles();
                generator.writeStartObject();
                generator.writeNumberField("total", Arrays.stream(files).filter(f -> !f.isHidden()).count());
                JsonWriter.writeImageData(generator, path.toFile(), skip, limit);
                JsonWriter.listFileNames(generator, "images", files, skip, limit);
                generator.writeEndObject();
                break;

            case "/DirectoryInspectorServlet/refresh":
                String restrict = request.getParameter("restrict");
                File[] files2 = userDir.resolve(datasetName).resolve(request.getParameter("folder")).toFile().listFiles();
                generator.writeStartObject();
                JsonWriter.listFileNames(generator, "datasets", userDir.toFile().listFiles(), 0, Integer.MAX_VALUE);
                if (restrict != null && !"".equals(restrict))
                    generator.writeNumberField("payload", Arrays.stream(files2).filter(f -> !f.isHidden()).count());
                else
                    JsonWriter.listFileNames(generator, "payload", files2, 0, Integer.MAX_VALUE);
                generator.writeEndObject();
                break;
        }
        generator.close();
        writer.close();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            processRequest(request, response);
        } catch (IOException ex) {
            Logger.getLogger(DirectoryInspectorServlet.class.getName()).log(Level.SEVERE, null, ex);
            response.sendError(500, ex.getMessage());
        }
    }

    @Override
    public String getServletInfo() {
        return "Short description";
    }

}
