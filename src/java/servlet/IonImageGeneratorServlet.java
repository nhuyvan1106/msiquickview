package servlet;

import com.mathworks.toolbox.javabuilder.*;
import java.io.*;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.logging.*;
import javax.inject.Inject;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import matlab.IonImageGenerator;
import resource.ApplicationResource;

@WebServlet(name = "IonImageGeneratorServlet", urlPatterns = {"/IonImageGeneratorServlet/generate-image"})
public class IonImageGeneratorServlet extends HttpServlet {

    @Inject
    private IonImageGenerator generator;
    @Inject
    private ApplicationResource res;
    
    protected void processRequest(HttpServletRequest request, HttpServletResponse response) throws IOException, MWException {
        double lowerBound = Double.parseDouble(request.getParameter("lower-bound"));
        double upperBound = Double.parseDouble(request.getParameter("upper-bound"));
        String[] fileNames = request.getParameter("file-names").split(",");
        Path dir = Paths.get(System.getProperty("user.home"), res.getStorage(), request.getParameter("user-dir"), 
                request.getParameter("dataset-name"), request.getParameter("file-type"));
        Writer writer = response.getWriter();
        for (int i = 0; i < fileNames.length; i++)
            fileNames[i] = dir.resolve(fileNames[i]).toString();

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
            response.sendError(500, ex.getMessage());
        }
    }

    @Override
    public String getServletInfo() {
        return "Short description";
    }

}
