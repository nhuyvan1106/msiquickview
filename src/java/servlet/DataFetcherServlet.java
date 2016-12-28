package servlet;

import com.fasterxml.jackson.core.JsonGenerator;
import com.mathworks.toolbox.javabuilder.*;
import java.io.*;
import java.nio.file.*;
import java.rmi.*;
import java.util.*;
import java.util.logging.*;
import java.util.stream.*;
import javax.annotation.Resource;
import javax.enterprise.concurrent.ManagedExecutorService;
import javax.inject.Inject;
import javax.servlet.*;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import org.apache.shiro.SecurityUtils;
import remote_proxy.Task;
import resource.ApplicationResource;
import rmi.tasks.*;

@WebServlet(name = "DataFetcherServlet", urlPatterns = {"/DataFetcherServlet/load-more", "/DataFetcherServlet/load-data",
"/DataFetcherServlet/image-data"})
public class DataFetcherServlet extends HttpServlet {

    @Inject
    private ApplicationResource res;
    @Resource(name = "java:comp/DefaultManagedExecutorService")
    private ManagedExecutorService pool;
    
    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException, MWException, RemoteException, NotBoundException {

        Path datasetDir = Paths.get(System.getProperty("user.home"), res.getStorage(), 
                                    SecurityUtils.getSubject().getPrincipal().toString(), request.getParameter("dataset-name"));
        response.setContentType("application/json");
        try (Writer writer = response.getWriter();
            JsonGenerator generator = res.getJsonFactory().createGenerator(writer)) {
            generator.writeStartObject();
            if (request.getServletPath().equals("/DataFetcherServlet/image-data"))
                try(BufferedReader reader = Files.newBufferedReader(datasetDir.resolve("imageData/" + request.getParameter("fileName") + ".txt"))) {
                        generator.writeArrayFieldStart("imageData");
                        reader.lines()
                                .map(line -> line.split(","))
                                .forEach(dataArray -> {
                                    try {
                                        generator.writeStartArray();
                                        for (String data: dataArray)
                                            generator.writeString(data);
                                        generator.writeEndArray();
                                    } catch (IOException ex) {
                                        Logger.getLogger(DataFetcherServlet.class.getName()).log(Level.SEVERE, null, ex);
                                    }
                                });
                        generator.writeEndArray();
                }
            else {
                String filePath = datasetDir.resolve(request.getParameter("file-type")+"/"+request.getParameter("file-name")).toString();
                CdfHdfReaderTask task = new CdfHdfReaderTask(filePath);
                Object[] result = getReadResult(request.getSession(), filePath, pool, task);
                if (request.getServletPath().equals("/DataFetcherServlet/load-data"))
                    sendLoadData(generator, result);
                else {
                    int nextSum = Integer.parseInt(request.getParameter("next-sum"));
                    int offset = Integer.parseInt(request.getParameter("offset"));
                    switch (request.getParameter("direction")) {
                        case "forward":
                            sendLoadMore(generator, result, offset, offset + nextSum);
                            break;
                        case "backward":
                            sendLoadMore(generator, result, offset - nextSum, offset);
                            break;
                    }
                }
                MWArray.disposeArray(task);
            }
            generator.writeEndObject();
        }
    }
    private void sendLoadData(JsonGenerator generator, Object[] result) throws IOException {
        int[] pointCount = cast(result[4]).getIntData();
        writeArray(generator, "pointCount", pointCount);
        int sum = IntStream.of(pointCount).limit(20).sum();
        for (int i = 0; i < result.length; i++)
            switch (i) {
                case 0:
                    writeArray(generator, "totalIntensity", cast(result[i]).getIntData());
                    break;
                case 1:
                    generator.writeArrayFieldStart("scanTime");
                    DoubleStream.of(cast(result[i]).getDoubleData()).forEach(e -> {
                        try {
                            generator.writeNumber(e);
                        } catch (IOException ex) {
                            Logger.getLogger(DataFetcherServlet.class.getName()).log(Level.SEVERE, null, ex);
                        }
                    });
                    generator.writeEndArray();
                    break;
                case 2:
                    writeArray(generator, "intensityValues", Arrays.copyOfRange(cast(result[i]).getIntData(), 0, sum));
                    break;
                case 3:
                    writeArray(generator, "massValues", Arrays.copyOfRange(cast(result[i]).getIntData(), 0, sum));
                    break;
            }
    }

    private void sendLoadMore(JsonGenerator generator, Object[] result, int start, int end) throws IOException {
        writeArray(generator, "intensityValues", Arrays.copyOfRange(cast(result[2]).getIntData(), start, end));
        writeArray(generator, "massValues", Arrays.copyOfRange(cast(result[3]).getIntData(), start, end));
    }

    private MWNumericArray cast(Object o) {
        return (MWNumericArray) o;
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            processRequest(request, response);
        } catch (MWException ex) {
            Logger.getLogger(DataFetcherServlet.class.getName()).log(Level.SEVERE, null, ex);
            response.sendError(500, ex.getMessage());
        } catch (RemoteException | NotBoundException ex) {
            Logger.getLogger(DataFetcherServlet.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    
    private void writeArray(JsonGenerator generator, String field, int[] array) {
        try {
            generator.writeArrayFieldStart(field);
            IntStream.of(array).forEach(e -> {
                try {
                    generator.writeNumber(e);
                } catch (IOException ex) {
                    Logger.getLogger(DataFetcherServlet.class.getName()).log(Level.SEVERE, null, ex);
                }
            });
            generator.writeEndArray();
        } catch (IOException ex) {
            Logger.getLogger(DataFetcherServlet.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    private Object[] getReadResult(final HttpSession session, final String fileName, final ManagedExecutorService pool, final Task<Object[]> task) {
        Object[] result = (Object[])session.getAttribute(fileName);
        System.out.println((result == null));
        if (result == null) {
            try {
                result = Tasks.runTask(pool, task, getServletContext().getRealPath("/WEB-INF"), "cdf_read.jar");
                session.setAttribute(fileName, result);
            } catch (RemoteException | NotBoundException ex) {
                Logger.getLogger(DataFetcherServlet.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return result;
    }
}
