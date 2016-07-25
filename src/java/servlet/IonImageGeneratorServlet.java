
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package servlet;

import com.mathworks.toolbox.javabuilder.*;
import java.io.*;
import java.util.Arrays;
import java.util.logging.*;
import javax.inject.Inject;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import matlab.IonImageGenerator;

/**
 *
 * @author NhuY
 */
@WebServlet(name = "IonImageGeneratorServlet", urlPatterns = {"/IonImageGeneratorServlet/generate-image"})
public class IonImageGeneratorServlet extends HttpServlet {

    @Inject
    private IonImageGenerator generator;
    protected void processRequest(HttpServletRequest request, HttpServletResponse response) throws IOException, MWException {
        double lowerBound = Double.parseDouble(request.getParameter("lower-bound"));
        double upperBound = Double.parseDouble(request.getParameter("upper-bound"));
        String[] fileNames = request.getParameter("file-names").split(",");
        String dir = request.getServletContext().getRealPath("/WEB-INF/temp") + File.separator + request.getParameter("user-dir")
                + File.separator + request.getParameter("dataset-name") + File.separator + request.getParameter("file-type");
        Writer writer = response.getWriter();
        
        for (int i = 0; i < fileNames.length; i++)
            fileNames[i] = dir + File.separator + fileNames[i];

        Object[] result = generator.generate(lowerBound, upperBound, fileNames);
        MWNumericArray array = (MWNumericArray)result[0];
        writer.write(Arrays.toString(array.getDimensions()) + "|");
        writer.write(Arrays.toString(array.getIntData()));

    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            processRequest(request, response);
        } catch (MWException ex) {
            Logger.getLogger(IonImageGeneratorServlet.class.getName()).log(Level.SEVERE, null, ex);
            response.sendError(500);
        }
    }

    @Override
    public String getServletInfo() {
        return "Short description";
    }

}
