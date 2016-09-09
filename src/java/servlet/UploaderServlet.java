package servlet;

import com.mathworks.toolbox.javabuilder.*;
import java.io.*;
import java.nio.file.*;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;
import java.util.*;
import java.util.logging.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.annotation.Resource;
import javax.enterprise.concurrent.ManagedExecutorService;
import javax.inject.Inject;
import javax.servlet.ServletException;
import javax.servlet.annotation.*;
import javax.servlet.http.*;
import ms.ExcelExtractor;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import resource.ApplicationResource;
import rmi.tasks.*;

@WebServlet(name = "UploaderServlet", urlPatterns = {"/UploaderServlet/upload", "/UploaderServlet/save-image",
    "/UploaderServlet/extract-excel"
})
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
                if (!Files.exists(userDirectory))
                    Stream.of("cdf", "hdf", "images", "excel")
                            .forEach(e -> {
                                try {
                                    Files.createDirectories(userDirectory.resolve(e));
                                } catch (IOException ex) {
                                    Logger.getLogger(UploaderServlet.class.getName()).log(Level.SEVERE, null, ex);
                                }
                            });
                request.getParts()
                        .stream()
                        .filter(part -> !part.getName().equalsIgnoreCase("user-dir") && !part.getName().equalsIgnoreCase("dataset-name"))
                        .forEach(part -> save(part, userDirectory, response));
                break;
            case "/UploaderServlet/save-image":
                String imageName = request.getParameter("image-name");
                copy(Base64.getDecoder().wrap(request.getPart("image-data").getInputStream()), userDirectory.resolve("images").resolve(imageName + ".png"), response);
                break;
            case "/UploaderServlet/extract-excel":
                List<String> fileNames = null;
                for (Part part : request.getParts()) {
                    switch (part.getName()) {
                        case "user-dir":
                        case "dataset-name":
                            break;
                        case "file-type":
                            fileNames = Stream.of(userDirectory.resolve(request.getParameter("file-type")).toFile().listFiles())
                                    .filter(f -> !f.isHidden())
                                    .map(File::toString)
                                    .collect(Collectors.toList());
                            break;
                        case "excel-file":
                            Path excel = userDirectory.resolve("excel").resolve(part.getSubmittedFileName());
                            if (!Files.exists(excel)) {
                                copy(part.getInputStream(), excel, response);
                                Double[][] ranges = ExcelExtractor.extractSheet(WorkbookFactory.create(excel.toFile()));
                                ImagesFromExcelTask task = new ImagesFromExcelTask(userDirectory.resolve("images").toString() + File.separator, fileNames, ranges);
                                Tasks.runTask(pool, task, getServletContext().getRealPath("/WEB-INF"), "save_ion_image_for_all_ranges_in_spreadsheet.jar");
                                System.out.println("AFTER generate");
                                ranges = null;
                            }
                            break;
                    }
                }
        }
    }
    private void save(Part part, Path userDirectory, HttpServletResponse response) {
        String fileName = part.getSubmittedFileName();
        Path file = userDirectory.resolve(fileName.contains("hdf") ? "hdf" : "cdf").resolve(fileName);
        try (InputStream is = part.getInputStream()) {
            if (!Files.exists(file))
                copy(is, file, response);
        } catch (IOException ex) {
            Logger.getLogger(UploaderServlet.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    private void copy(InputStream is, Path path, HttpServletResponse response) throws IOException {
        try {
            Files.copy(is, path);
            is.close();
        } catch (IOException ex) {
            Logger.getLogger(UploaderServlet.class.getName()).log(Level.SEVERE, null, ex);
            response.sendError(500, "File you're trying to save already exists");
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

    @Override
    public String getServletInfo() {
        return "Short description";
    }
}