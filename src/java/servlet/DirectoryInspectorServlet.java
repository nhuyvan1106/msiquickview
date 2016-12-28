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
import org.apache.shiro.SecurityUtils;
import resource.ApplicationResource;

@WebServlet(name = "DirectoryInspectorServlet", urlPatterns = {"/DirectoryInspectorServlet/view-files", "/DirectoryInspectorServlet/load-more-images",
    "/DirectoryInspectorServlet/refresh"})
public class DirectoryInspectorServlet extends HttpServlet {

    @Inject
    private ApplicationResource resources;

    protected void processRequest(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        Path userDir = Paths.get(System.getProperty("user.home"), resources.getStorage(), SecurityUtils.getSubject().getPrincipal().toString());
        String datasetName = request.getParameter("dataset-name");
        Writer writer = response.getWriter();
        JsonGenerator generator = resources.getJsonFactory().createGenerator(writer);
        switch (request.getServletPath()) {
            case "/DirectoryInspectorServlet/view-files":
                JsonWriter.writeUserDir(generator, userDir, datasetName);
                break;

            case "/DirectoryInspectorServlet/load-more-images":
                String existingImages = request.getParameter("image-names");
                int limit = Integer.parseInt(request.getParameter("limit"));
                Path imageFolderPath = userDir.resolve(datasetName).resolve(request.getParameter("image-folder"));
                File[] images = Files.list(imageFolderPath)
                        .filter(image -> existingImages.indexOf(image.getFileName().toString()) == -1)
                        .map(Path::toFile)
                        .filter(image -> !image.isHidden())
                        .toArray(File[]::new);
                generator.writeStartObject();
                generator.writeNumberField("total", Files.list(imageFolderPath).filter(image -> {
                    try {
                        return !Files.isHidden(image);
                    } catch (IOException ex) {
                        Logger.getLogger(DirectoryInspectorServlet.class.getName()).log(Level.SEVERE, null, ex);
                        return false;
                    }
                }).count());
                if (images.length == 0) {
                    generator.writeArrayFieldStart("imageData");
                    generator.writeEndArray();
                }
                else
                    JsonWriter.writeImageData(generator, "imageData", images, 0, limit);
                JsonWriter.listFileNames(generator, "imageNames", images, 0, limit);
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
