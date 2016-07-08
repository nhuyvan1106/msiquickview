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
        
        switch (request.getServletPath()) {
            case "/DataFetcherServlet/load-data":
                println("READING...");
                long startTime = System.currentTimeMillis();
                Object[] result = reader.read(request.getServletContext().getRealPath("/WEB-INF/temp/" + request.getParameter("user-dir")) + File.separator + request.getParameter("file-name"));
                println("READING TOOK: " + (System.currentTimeMillis() - startTime) + " milliseconds");
                request.getSession().setAttribute("cdfReader", reader);
                sendLoadData(response.getWriter(), result);
                break;

            case "/DataFetcherServlet/load-more":
                println("========================");
                reader = (CdfReader) request.getSession().getAttribute("cdfReader");
                int offset = Integer.parseInt(request.getParameter("offset"));
                int start = Integer.parseInt(request.getParameter("start"));
                int end = Integer.parseInt(request.getParameter("end"));
                String fileName = request.getServletContext().getRealPath("/WEB-INF/temp/" + request.getParameter("user-dir")) + File.separator + request.getParameter("file-name");

                result = reader.read(fileName);
                int nextSum = 0;
                for (int i : Arrays.copyOfRange(cast(result[4]).getIntData(), start, end)) {
                    nextSum += i;
                }
                switch (request.getParameter("direction")) {
                    case "forward":
                        System.out.println("FETCHING...");
                        sendLoadMore(response.getWriter(), result, offset, offset + nextSum);
                        System.out.println("FETCHING DONE...");
                        break;

                    case "backward":
                        System.out.println("FETCHING...");
                        sendLoadMore(response.getWriter(), result, offset - nextSum, offset);
                        System.out.println("FETCHING DONE...");
                        break;
                }
                println("========================");
                break;
        }

    }

    private void sendLoadData(Writer writer, Object[] result) throws IOException {
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

    private void sendLoadMore(Writer writer, Object[] result, int start, int end) throws IOException {
        println("SENDING...");
        long startTime = System.currentTimeMillis();
        writer.write(Arrays.toString(Arrays.copyOfRange(cast(result[2]).getFloatData(), start, end)));
        writer.write("|");
        writer.flush();

        writer.write(Arrays.toString(Arrays.copyOfRange(cast(result[3]).getFloatData(), start, end)));
        writer.close();
        println("SENDING TOOK: " + (System.currentTimeMillis() - startTime) + " milliseconds");
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
