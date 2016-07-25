/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package servlet;

import java.io.File;
import java.io.IOException;
import java.io.Writer;
import javax.inject.Inject;
import javax.servlet.ServletException;
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
@WebServlet(name = "DirectoryInspectorServlet", urlPatterns = {"/DirectoryInspectorServlet/view-files"})
public class DirectoryInspectorServlet extends HttpServlet {

    @Inject
    private ApplicationResourcePool resources;

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        String userDir = request.getServletContext().getRealPath("/WEB-INF/temp") + File.separator + request.getParameter("user-dir");
        String datasetName = request.getParameter("dataset-name");
        try (Writer writer = response.getWriter()) {
            JsonWriter.writeUserDir(resources.getJsonFactory().createJsonGenerator(writer), userDir, datasetName);
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    @Override
    public String getServletInfo() {
        return "Short description";
    }

}
