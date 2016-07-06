package servlet;

import com.mathworks.toolbox.javabuilder.MWException;
import com.mathworks.toolbox.javabuilder.MWNumericArray;
import java.io.*;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
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
@WebServlet(name = "DataFetcherServlet", urlPatterns = {"/DataFetcherServlet/load-more"})
public class DataFetcherServlet extends HttpServlet {
    
    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException, MWException {
        println("========================");
        CdfReader reader = (CdfReader) request.getSession().getAttribute("cdfReader");
        int offset = Integer.parseInt(request.getParameter("offset"));
        int start = Integer.parseInt(request.getParameter("start"));
        int end = Integer.parseInt(request.getParameter("end"));
        String fileName = request.getServletContext().getRealPath("/WEB-INF/temp") + File.separator + request.getParameter("file-name");

        Object[] result = reader.read(fileName);
        int nextSum = 0;
        for (int i : Arrays.copyOfRange(cast(result[4]).getIntData(), start, end)) {
            nextSum += i;
        }
        switch (request.getParameter("direction")) {
            case "forward":
                System.out.println("FETCHING...");
                send(response.getWriter(), result, offset, offset+nextSum);
                System.out.println("FETCHING DONE...");
                break;

            case "backward":
                System.out.println("FETCHING...");
                send(response.getWriter(), result, offset-nextSum, offset);
                System.out.println("FETCHING DONE...");
                break;
        }
        println("========================");
    }

    private void send(Writer writer, Object[] result, int start, int end) throws IOException {
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
            response.sendError(500, "An error occurred while processing your request. Please contact technica support.");
        }
    }

    @Override
    public String getServletInfo() {
        return "Short description";
    }
}