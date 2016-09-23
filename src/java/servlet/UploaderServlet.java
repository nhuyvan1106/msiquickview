package servlet;

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
import javax.servlet.annotation.*;
import javax.servlet.http.*;
import ms.ExcelExtractor;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.*;
import resource.ApplicationResource;
import rmi.tasks.*;

@WebServlet(name = "UploaderServlet", urlPatterns = {"/UploaderServlet/upload", "/UploaderServlet/save-image",
    "/UploaderServlet/extract-excel", "/UploaderServlet/extract-excel-done"}, asyncSupported = true)
@MultipartConfig
public class UploaderServlet extends HttpServlet {

    @Resource(name = "java:comp/DefaultManagedExecutorService")
    private ManagedExecutorService pool;
    @Inject
    private ApplicationResource res;

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException, MWException, InvalidFormatException, RemoteException, NotBoundException {

        final Path userDirectory = Paths.get(System.getProperty("user.home"), res.getStorage(), request.getParameter("user-dir"), request.getParameter("dataset-name"));
        switch (request.getServletPath()) {
            case "/UploaderServlet/upload":
                Path cdfHdfDir = userDirectory.resolve(request.getParameter("folder"));
                if (!Files.exists(userDirectory))
                    Stream.of("cdf", "hdf", "images", "excel")
                            .forEach(e -> userDirectory.resolve(e).toFile().mkdirs());
                else if (Files.list(cdfHdfDir).count() == 0)
                    request.getParts()
                            .parallelStream()
                            .skip(3) //Not interested in these first 3 params 'user-dir', 'dataset-name', 'folder'
                            .forEach(part -> save(part, cdfHdfDir, response));
                break;

            case "/UploaderServlet/save-image":
                String imageName = request.getParameter("image-name");
                copy(Base64.getDecoder().wrap(request.getPart("image-data").getInputStream()), userDirectory.resolve("images").resolve(imageName + ".png"), response);
                break;

            case "/UploaderServlet/extract-excel":
                List<String> fileNames = Stream.of(userDirectory.resolve(request.getParameter("file-type")).toFile().listFiles())
                        .filter(f -> !f.isHidden())
                        .map(File::toString)
                        .collect(Collectors.toList());
                Part excelPart = request.getPart("excel-file");
                Path excel = userDirectory.resolve("excel").resolve(excelPart.getSubmittedFileName());
                if (!Files.exists(excel)) {
                    String thresholdParam = request.getParameter("threshold");
                    int threshold = thresholdParam == null || "".equals(thresholdParam) ? 1000 : Integer.parseInt(thresholdParam);
                    AsyncContext ctx = request.startAsync();
                    copy(excelPart.getInputStream(), excel, response);
                    try (Workbook wb = WorkbookFactory.create(excel.toFile())) {
                        Double[][] ranges = ExcelExtractor.extractSheet(wb);
                        ImagesFromExcelTask task = new ImagesFromExcelTask(userDirectory.resolve("images").toString() + File.separator, fileNames, ranges, threshold, userDirectory.getFileName().toString());
                        Tasks.runTask(pool, task, getServletContext().getRealPath("/WEB-INF"), "save_ion_image_for_all_ranges_in_spreadsheet_v2.jar");
                        ranges = null;
                        task.dispose();
                    }
                    ctx.complete();
                    response.setStatus(200);
                    response.flushBuffer();
                }
                break;
        }
    }

    private void save(Part part, Path cdfHdfFolder, HttpServletResponse response) {
        Path file = cdfHdfFolder.resolve(part.getSubmittedFileName());
        try (InputStream is = part.getInputStream()) {
            if (!Files.exists(file)) {
                copy(is, file, response);
            }
        } catch (IOException ex) {
            Logger.getLogger(UploaderServlet.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    private void copy(InputStream is, Path path, HttpServletResponse response) throws IOException {
        try {
            Files.copy(is, path);
        } catch (IOException ex) {
            Logger.getLogger(UploaderServlet.class.getName()).log(Level.SEVERE, null, ex);
            response.sendError(500, "File you're trying to save already exists");
        } finally {
            is.close();
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            processRequest(request, response);
        } catch (ServletException | NotBoundException | MWException | InvalidFormatException ex) {
            Logger.getLogger(UploaderServlet.class.getName()).log(Level.SEVERE, null, ex);
            response.sendError(500, ex.getMessage());
        }
    }
}
