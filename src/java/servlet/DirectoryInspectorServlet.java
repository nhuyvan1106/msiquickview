/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package servlet;

import com.fasterxml.jackson.core.JsonGenerator;
import java.io.File;
import java.io.IOException;
import java.io.Writer;
import java.util.Arrays;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.inject.Inject;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import json.JsonWriter;
import resource.ApplicationResourcePool;

/**
 *
 * @author NhuY
 */
@WebServlet(name = "DirectoryInspectorServlet", urlPatterns = {"/DirectoryInspectorServlet/view-files", "/DirectoryInspectorServlet/load-more-images"})
public class DirectoryInspectorServlet extends HttpServlet {

    @Inject
    private ApplicationResourcePool resources;

    protected void processRequest(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        String userDir = request.getServletContext().getRealPath("/WEB-INF/temp") + File.separator + request.getParameter("user-dir");
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
                String path = userDir + File.separator + datasetName + File.separator + "images";
                File[] files = new File(path).listFiles();
                generator.writeStartObject();
                generator.writeStringField("total", String.valueOf(Arrays.stream(files).filter(f -> !f.isHidden()).count()));
                JsonWriter.writeImageData(generator, path, skip, limit);
                JsonWriter.listFileNames(generator, "images", files, skip, limit);
                generator.writeEndObject();
                generator.close();
                break;
        }
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
