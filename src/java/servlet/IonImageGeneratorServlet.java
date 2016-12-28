package servlet;

import com.fasterxml.jackson.core.JsonGenerator;
import com.mathworks.toolbox.javabuilder.*;
import java.io.*;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.logging.*;
import javax.inject.Inject;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import matlab.IonImageGenerator;
import org.apache.shiro.SecurityUtils;
import resource.ApplicationResource;
import rmi.tasks.PixelCountTask;

@WebServlet(name = "IonImageGeneratorServlet", urlPatterns = {"/IonImageGeneratorServlet/generate-image", "/IonImageGeneratorServlet/roi"})
public class IonImageGeneratorServlet extends HttpServlet {

    @Inject
    private IonImageGenerator imageGenerator;
    @Inject
    private ApplicationResource res;
    
    protected void processRequest(HttpServletRequest request, HttpServletResponse response) throws IOException, MWException {
        switch (request.getServletPath()) {
            case "/IonImageGeneratorServlet/generate-image":
               double lowerBound = Double.parseDouble(request.getParameter("lower-bound"));
                double upperBound = Double.parseDouble(request.getParameter("upper-bound"));
                String[] fileNames = request.getParameter("file-names").split(",");
                Path dir = Paths.get(System.getProperty("user.home"), res.getStorage(), SecurityUtils.getSubject().getPrincipal().toString(), 
                                    request.getParameter("dataset-name"), request.getParameter("file-type"));
                for (int i = 0; i < fileNames.length; i++)
                    fileNames[i] = dir.resolve(fileNames[i]).toString();
                Object[] result = imageGenerator.generate(lowerBound, upperBound, fileNames);
                MWNumericArray array = (MWNumericArray)result[0];
                response.setContentType("application/json");
                try (Writer writer = response.getWriter();
                    JsonGenerator generator = res.getJsonFactory().createGenerator(writer)) {
                    generator.writeStartObject();
                        writeArray(generator, "dimension", array.getDimensions());
                        writeArray(generator, "pixels", array.getIntData());
                    generator.writeEndObject();
                }
                MWArray.disposeArray(array);
                array = null;
                result = null;
                break;
                
            case "/IonImageGeneratorServlet/roi":
                int[] pixels = Arrays.stream(request.getParameterValues("selectedPixels[]"))
                        .mapToInt(Integer::parseInt)
                        .toArray();
                PixelCountTask pixelTask = new PixelCountTask(pixels);
                Object size = pixelTask.doTask()[0];
                System.out.println("Result: " + size.toString());
                response.getWriter().write(size.toString());
                MWArray.disposeArray(pixelTask);
                pixelTask = null;
                break;
        }
        

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
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
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

    private int[] convert(Map.Entry<String, String[]> entry) {
        return Arrays.stream(entry.getValue()).mapToInt(e -> Integer.parseInt(e)).toArray();
    }
    private void writeArray(JsonGenerator generator, String field, int[] array) {
        try {
            generator.writeArrayFieldStart(field);
            Arrays.stream(array).forEach(e -> {
                try {
                    generator.writeNumber(e);
                } catch (IOException ex) {
                    Logger.getLogger(IonImageGeneratorServlet.class.getName()).log(Level.SEVERE, null, ex);
                }
            });
            generator.writeEndArray();
        } catch (IOException ex) {
            Logger.getLogger(IonImageGeneratorServlet.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

}