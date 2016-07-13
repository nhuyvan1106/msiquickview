/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package servlet;

import com.mathworks.toolbox.javabuilder.MWException;
import com.mathworks.toolbox.javabuilder.MWNumericArray;
import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.Writer;
import java.util.Arrays;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.inject.Inject;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
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
        String userDir = request.getParameter("user-dir");
        String[] fileNames = request.getParameter("file-names").split(",");
        String dir = request.getServletContext().getRealPath("/WEB-INF/temp/" + userDir);
        Writer writer = response.getWriter();
        for (int i = 0; i < fileNames.length; i++)
            fileNames[i] = dir + File.separator + fileNames[i];
        System.out.println("********* GENERATING *********");
        Object[] result = generator.generate(lowerBound, upperBound, fileNames);
        MWNumericArray array = (MWNumericArray)result[0];
        writer.write(Arrays.toString(array.getDimensions()) + "|");
        writer.write(Arrays.toString(array.getIntData()));
        System.out.println("DONE");
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
