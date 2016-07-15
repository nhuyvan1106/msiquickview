package servlet;

import com.mathworks.toolbox.javabuilder.MWException;
import com.mathworks.toolbox.javabuilder.MWNumericArray;
import java.io.*;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.inject.Inject;
import javax.servlet.*;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import matlab.CdfReader;

/**
 *
 * @author vann363
 */
@WebServlet(name = "DataFetcherServlet", urlPatterns = {"/DataFetcherServlet/load-more", "/DataFetcherServlet/load-data"})
public class DataFetcherServlet extends HttpServlet {

    @Inject
    private CdfReader reader;
    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException, MWException {
        String userDir = request.getParameter("user-dir");
        String datasetName = request.getParameter("dataset-name");
        String fileType = request.getParameter("file-type");
        String filePath = request.getServletContext().getRealPath("/WEB-INF/temp/" + userDir + "/"
                + datasetName + "/" + fileType + "/" + request.getParameter("file-name"));
        Object[] result = reader.read(filePath);
        
        switch (request.getServletPath()) {
            case "/DataFetcherServlet/load-data":
                sendLoadData(response.getWriter(), result);
                break;

            case "/DataFetcherServlet/load-more":
                int nextSum = Integer.parseInt(request.getParameter("next-sum"));
                int offset = Integer.parseInt(request.getParameter("offset"));
                switch (request.getParameter("direction")) {
                    case "forward":
                        sendLoadMore(response.getWriter(), result, offset, offset + nextSum);
                        break;
                    case "backward":
                        sendLoadMore(response.getWriter(), result, offset - nextSum, offset);
                        break;
                }
                break;
        }

    }

    private void sendLoadData(Writer writer, Object[] result) throws IOException {
        int[] pointCount = cast(result[4]).getIntData();
        int sum = 0;
        for (int i = 0; i < 20; i++) {
            sum += pointCount[i];
        }
        for (int i = 0; i < result.length; i++) {
            switch (i) {
                case 0:
                case 1:
                    // We write total intensity and scan time first
                    writer.write(Arrays.toString(cast(result[i]).getFloatData()));
                    writer.write("|");
                    writer.flush();
                    break;
                case 2:
                case 3:
                    // Then intensity and mass values for the next 20 points
                    writer.write(Arrays.toString(Arrays.copyOfRange(cast(result[i]).getFloatData(), 0, sum)));
                    writer.write("|");
                    writer.flush();
                    break;
                case 4:
                    // Point count array is small. So we can write it entirely to cliently w/o getting OutOfMemory exception
                    writer.write(Arrays.toString(pointCount));
                    writer.flush();
                    writer.close();
                    break;
            }
        }
    }

    private void sendLoadMore(Writer writer, Object[] result, int start, int end) throws IOException {
        writer.write(Arrays.toString(Arrays.copyOfRange(cast(result[2]).getFloatData(), start, end)));
        writer.write("|");
        writer.flush();

        writer.write(Arrays.toString(Arrays.copyOfRange(cast(result[3]).getFloatData(), start, end)));
        writer.close();
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
            Logger.getLogger(DataFetcherServlet.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @Override
    public String getServletInfo() {
        return "Short description";
    }
}
