/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package servlet;

import com.fasterxml.jackson.core.JsonGenerator;
import java.io.*;
import java.util.Arrays;
import java.util.logging.*;
import javax.inject.Inject;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import json.JsonWriter;
import resource.ApplicationResourcePool;

/**
 *
 * @author NhuY
 */
@WebServlet(name = "DirectoryInspectorServlet", urlPatterns = {"/DirectoryInspectorServlet/view-files", "/DirectoryInspectorServlet/load-more-images",
"/DirectoryInspectorServlet/refresh"})
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
                break;
                
            case "/DirectoryInspectorServlet/refresh":
                String restrict = request.getParameter("restrict");
                File[] files2 = new File(userDir + File.separator + datasetName + File.separator + request.getParameter("folder")).listFiles();
                generator.writeStartObject();
                if (restrict != null && !"".equals(restrict))
                    generator.writeStringField("payload", String.valueOf(Arrays.stream(files2).filter(f -> !f.isHidden()).count()));
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
