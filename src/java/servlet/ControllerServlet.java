package servlet;

import com.mathworks.toolbox.javabuilder.*;
import java.io.*;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.logging.*;
import javax.inject.Inject;
import javax.servlet.ServletException;
import javax.servlet.annotation.*;
import javax.servlet.http.*;
import matlab.CdfReader;

@WebServlet(name = "ControllerServlet", urlPatterns = {"/ControllerServlet/load-data"})
@MultipartConfig
public class ControllerServlet extends HttpServlet {

    @Inject
    private CdfReader reader;

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException, MWException {
        for (Part part : request.getParts()) {
            String fileName = part.getSubmittedFileName();
            int index = fileName.lastIndexOf("\\");
            fileName = index != -1 ? fileName.substring(index + 1) : fileName;
            File file = new File(request.getServletContext().getRealPath("/WEB-INF/temp") + File.separator + fileName);
            try (InputStream is = part.getInputStream()) {
                if (!file.exists()) {
                    Files.copy(is, file.toPath());
                }
            }
            println("READING...");
            long start = System.currentTimeMillis();
            Object[] result = reader.read(file.toString());
            println("READING TOOK: " + (System.currentTimeMillis() - start) + " milliseconds");

            request.getSession().setAttribute("cdfReader", reader);
            send(response.getWriter(), result);
        }
    }

    private void send(Writer writer, Object[] result) throws IOException {
        int temp = 0;
        System.out.println("INTENSITY VALUES LENGTH: " + cast(result[2]).getDoubleData().length);
        // For debugging
        for (int i : cast(result[4]).getIntData()) {
            temp += i;
        }
        System.out.println("TOTAL POINT COUNT FOR THIS BATCH: " + temp);

        int[] pointCount = cast(result[4]).getIntData();
        int sum = 0;
        for (int i = 0; i < 20; i++) {
            sum += pointCount[i];
        }
        System.out.println("SUM: " + sum);
        println("SENDING...");
        long start = System.currentTimeMillis();
        for (int i = 0; i < result.length; i++) {
            switch (i) {
                case 0:
                case 1:
                    writer.write(Arrays.toString(cast(result[i]).getFloatData()));
                    writer.write("|");
                    writer.flush();
                    break;
                case 2:
                case 3:
                    writer.write(Arrays.toString(Arrays.copyOfRange(cast(result[i]).getFloatData(), 0, sum)));
                    writer.write("|");
                    writer.flush();
                    break;
                case 4:
                    writer.write(Arrays.toString(pointCount));
                    writer.flush();
                    writer.close();
                    break;
            }
        }
        println("SENDING TOOK: " + (System.currentTimeMillis() - start) + " milliseconds");
    }

    private MWNumericArray cast(Object o) {
        return (MWNumericArray) o;
    }

    private void println(Object msg) {
        System.out.println(msg.toString());
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            processRequest(request, response);
        } catch (MWException ex) {
            Logger.getLogger(ControllerServlet.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            processRequest(request, response);
        } catch (MWException ex) {
            Logger.getLogger(ControllerServlet.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @Override
    public String getServletInfo() {
        return "Short description";
    }
}
