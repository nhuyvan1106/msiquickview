package servlet;

import com.mathworks.toolbox.javabuilder.*;
import java.io.*;
import java.net.*;
import java.nio.file.*;
import static java.nio.file.StandardOpenOption.*;
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
import org.apache.shiro.SecurityUtils;
import resource.ApplicationResource;
import rmi.tasks.*;

@WebServlet(name = "UploaderServlet", urlPatterns = {"/UploaderServlet/upload", "/UploaderServlet/save-image", "/UploaderServlet/elasticsearch",
    "/UploaderServlet/extract-excel", "/UploaderServlet/extract-excel-done", "/UploaderServlet/roi", "/UploaderServlet/optical"}, asyncSupported = true)
@MultipartConfig
public class UploaderServlet extends HttpServlet {

    @Resource(name = "java:comp/DefaultManagedExecutorService")
    private ManagedExecutorService pool;
    @Inject
    private ApplicationResource res;

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException, MWException, InvalidFormatException, RemoteException, NotBoundException {

        final Path userDirectory = Paths.get(System.getProperty("user.home"), res.getStorage(),
                                    SecurityUtils.getSubject().getPrincipal().toString(), request.getParameter("dataset-name"));
        switch (request.getServletPath()) {
            case "/UploaderServlet/upload":
                Path cdfHdfDir = userDirectory.resolve(request.getParameter("folder"));
                if (!Files.exists(userDirectory)) {
                    Files.createDirectories(userDirectory.resolve("rois"));
                    Stream.of("cdf", "hdf", "images", "excel", "optical", "rois/roiImages", "rois/points", "cluster", "overlays", "imageData")
                            .forEach(e -> userDirectory.resolve(e).toFile().mkdir());
                }
                else {
                    request.getParts()
                            .parallelStream()
                            .skip(4) //Not interested in these first 4 params 'user-dir', 'dataset-name', 'folder', 'opticalImage'
                            .forEach(part -> save(part, cdfHdfDir, response));
                    if (request.getPart("opticalImage").getSubmittedFileName() != null)
                        save(request.getPart("opticalImage"), userDirectory.resolve("optical"), response);
                }
                response.getWriter().write(Files.list(cdfHdfDir)
                        .filter(path -> !path.toFile().isHidden())
                        .map(path -> path.getFileName().toString())
                        .collect(Collectors.joining("|")));
                break;

            case "/UploaderServlet/save-image":
                for (Part part : request.getParts()) {
                    switch (part.getName()) {
                        case "dataset-name":
                        case "user-dir":
                        case "image-data":
                            break;
                        case "image-name":
                            copy(Base64.getDecoder().wrap(request.getPart("image-data").getInputStream()), userDirectory.resolve("images").resolve(request.getParameter("image-name") + "_.png"), response);
                            break;
                        default:
                            try (BufferedWriter bWriter = Files.newBufferedWriter(userDirectory.resolve("imageData/" + request.getParameter("image-name") + "_.txt"), CREATE, APPEND);
                                    BufferedReader bReader = new BufferedReader(new InputStreamReader(part.getInputStream()))) {
                                bReader.lines().forEach(line -> {
                                    try {
                                        bWriter.write(line);
                                        bWriter.newLine();
                                    } catch (IOException ex) {
                                        Logger.getLogger(UploaderServlet.class.getName()).log(Level.SEVERE, null, ex);
                                    }
                                });
                            }
                            break;
                    }
                }

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
                        double[][] ranges = ExcelExtractor.extractSheet(wb);
                        ImagesFromExcelTask task = new ImagesFromExcelTask(userDirectory.resolve("images").toString() + File.separator, fileNames, ranges, threshold, userDirectory.getFileName().toString());
                        Tasks.runTask(pool, task, getServletContext().getRealPath("/WEB-INF"), "save_ion_image_for_all_ranges_in_spreadsheet_v2.jar");
                        ranges = null;
                        MWArray.disposeArray(task);
                        task = null;
                    }
                    ctx.complete();
                }
                response.setStatus(200);
                response.getWriter().write(excel.getFileName().toString());
                break;

            case "/UploaderServlet/roi":
                String roiImageName = request.getParameter("roiImageName");
                try (InputStream is = request.getPart("roiImageData").getInputStream()) {
                    copy(Base64.getDecoder().wrap(is), userDirectory.resolve("rois").resolve("roiImages").resolve(roiImageName + ".png"), response);
                }
                saveSelectedPixels(userDirectory, request.getParameter("selectedPixels"), roiImageName);
                response.setStatus(200);
                break;

            case "/UploaderServlet/optical":
                copy(request.getPart("opticalImageFile").getInputStream(), userDirectory.resolve("optical/" + request.getPart("opticalImageFile").getSubmittedFileName()), response);
                break;

            case "/UploaderServlet/elasticsearch":
                String data = request.getParameter("data");
                String method = request.getParameter("method");
                //URL for ES http://localhost:9200/msi_quickview/type/id/endpoint .e.g endpoint could be _update,...
                StringBuilder urlBuilder = new StringBuilder("http://localhost:9200/msi_quickview/");
                urlBuilder.append(SecurityUtils.getSubject().getPrincipal().toString()) // type
                        .append("/")
                        .append(request.getParameter("dataset-name")) // id
                        .append("/")
                        .append(request.getParameter("endpoint"));
                URL url = new URL(urlBuilder.toString());
                //TODO remove
                System.out.println(urlBuilder.toString());
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setDoOutput(true);
                connection.setAllowUserInteraction(true);
                connection.setRequestMethod(method);

                //connection.setRequestProperty("Authorization", "Basic ZWxhc3RpYzpjaGFuZ2VtZQ==");
                connection.connect();
                try (OutputStream os = connection.getOutputStream()) {
                    os.write(data.getBytes("UTF-8"));
                }
                System.out.println("RESPONSE: " + connection.getResponseMessage());
                System.out.println("DATA: " + data);
                connection.disconnect();
                break;
        }
    }

    private void save(Part part, Path cdfHdfFolder, HttpServletResponse response) {
        Path file = cdfHdfFolder.resolve(part.getSubmittedFileName());
        try (InputStream is = part.getInputStream()) {
            if (!Files.exists(file))
                copy(is, file, response);
        } catch (IOException ex) {
            Logger.getLogger(UploaderServlet.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    private void saveSelectedPixels(Path userDirectory, String selectedPixels, String roiImageName) {
        try (BufferedWriter bWriter = Files.newBufferedWriter(userDirectory.resolve("rois").resolve("points").resolve(roiImageName + ".csv"), CREATE, WRITE, APPEND)) {
            bWriter.write("row,selected pixels");
            bWriter.newLine();
            for (String row : selectedPixels.split("\\s*-1\\s*")) {
                bWriter.write(row.substring(0, 1) + "," + row.substring(1));
                bWriter.newLine();
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
