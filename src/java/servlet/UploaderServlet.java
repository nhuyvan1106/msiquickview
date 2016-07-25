package servlet;

import com.mathworks.toolbox.javabuilder.*;
import java.io.*;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collection;
import java.util.List;
import java.util.logging.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.inject.Inject;
import javax.servlet.ServletException;
import javax.servlet.annotation.*;
import javax.servlet.http.*;
import matlab.ExcelIonImageGenerator;
import ms.ExcelExtractor;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.WorkbookFactory;

@WebServlet(name = "UploaderServlet", urlPatterns = {"/UploaderServlet/upload", "/UploaderServlet/save-image",
    "/UploaderServlet/extract-excel"
})
@MultipartConfig
public class UploaderServlet extends HttpServlet {

    @Inject
    private ExcelIonImageGenerator generator;

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException, MWException, InvalidFormatException {
        
        List<String> d = getUserDirDatasetName(request.getParts());
        final String userDir = d.get(0);
        final String datasetName = d.get(1);
        final String dir = request.getServletContext().getRealPath("/WEB-INF/temp") + File.separator 
                + userDir + File.separator + datasetName + File.separator;
        switch (request.getServletPath()) {
            case "/UploaderServlet/upload":
                for (Part part : request.getParts()) {
                    switch (part.getName().toLowerCase()) {
                        case "user-dir":
                            break;
                        case "dataset-name":
                            File userDirectory = new File(dir);
                            if (!userDirectory.exists()) {
                                userDirectory.mkdirs();
                                Stream.of("cdf", "hdf", "images", "excel")
                                        .forEach(e -> new File(dir + e).mkdir());
                            }
                            break;
                        default:
                            File file = null;
                            String fileName = part.getSubmittedFileName();
                            if (fileName.contains("hdf"))
                                file = new File(dir + "hdf" + File.separator + fileName);
                            else
                                file = new File(dir + "cdf" + File.separator + fileName);
                            try (InputStream is = part.getInputStream()) {
                                if (!file.exists())
                                    Files.copy(is, file.toPath());
                            }
                            break;
                    }
                }
                break;
            case "/UploaderServlet/save-image":
                String imageName = null;
                for (Part part : request.getParts()) {
                    switch (part.getName()) {
                        case "image-name":
                            imageName = getFileName(part);
                            break;
                        case "image-data":
                            Files.copy(Base64.getDecoder().wrap(part.getInputStream()), new File(dir + "images" + File.separator + imageName + ".png").toPath());
                            break;
                    }
                }
                break;

            case "/UploaderServlet/extract-excel":
                for (Part part : request.getParts()) {
                    switch (part.getName()) {
                        case "user-dir":
                        case "dataset-name":
                            break;
                        case "excel-file":
                            Path excel = Paths.get(dir + "excel", part.getSubmittedFileName());
                            if (!Files.exists(excel))
                                Files.copy(part.getInputStream(), excel);
                            Double[][] ranges = ExcelExtractor.extractSheet(WorkbookFactory.create(excel.toFile()));
                            generator.generate(dir + "images" + File.separator, ranges);
                            System.out.println("AFTER generate");
                            ranges = null;
                            break;
                    }
                }
        }
    }

    private String getFileName(Part part) {
        try (BufferedReader r = new BufferedReader(new InputStreamReader(part.getInputStream()))) {
            return r.readLine();
        } catch (IOException ex) {
            Logger.getLogger(UploaderServlet.class.getName()).log(Level.SEVERE, null, ex);
            return null;
        }
    }

    private List<String> getUserDirDatasetName(Collection<Part> parts) {
        return parts.stream().filter(e -> e.getName().equals("user-dir") || e.getName().equals("dataset-name"))
                .map(this::getFileName)
                .collect(() -> new ArrayList<String>(2), ArrayList::add, ArrayList::addAll);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            processRequest(request, response);
        } catch (MWException | InvalidFormatException ex) {
            Logger.getLogger(UploaderServlet.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @Override
    public String getServletInfo() {
        return "Short description";
    }
}