package servlet;

import com.mathworks.toolbox.javabuilder.*;
import java.io.*;
import java.nio.file.Files;
import java.util.logging.*;
import javax.servlet.ServletException;
import javax.servlet.annotation.*;
import javax.servlet.http.*;

@WebServlet(name = "UploaderServlet", urlPatterns = {"/UploaderServlet/upload"})
@MultipartConfig
public class UploaderServlet extends HttpServlet {

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException, MWException {

        String userDir = null;
        String datasetName = null;
        String tempDir = null;

        switch (request.getServletPath()) {
            case "/UploaderServlet/upload":
                for (Part part : request.getParts()) {
                    switch (part.getName().toLowerCase()) {
                        case "user-dir":
                            userDir = getFileName(part);
                            break;
                        case "dataset-name":
                            datasetName = getFileName(part);
                            tempDir = request.getServletContext().getRealPath("/WEB-INF/temp/" + userDir + "/" + datasetName);
                            File userDirectory = new File(tempDir);
                            if (!userDirectory.exists()) {
                                userDirectory.mkdirs();
                                new File(tempDir + File.separator + "cdf").mkdir();
                                new File(tempDir + File.separator + "hdf").mkdir();
                                new File(tempDir + File.separator + "images").mkdir();
                            }
                            break;
                        default:
                            File file = null;
                            String fileName = part.getSubmittedFileName();
                            if (fileName.contains("hdf")) {
                                file = new File(tempDir + File.separator + "hdf" + File.separator + fileName);
                            } else {
                                file = new File(tempDir + File.separator + "cdf" + File.separator + fileName);
                            }
                            try (InputStream is = part.getInputStream()) {
                                if (!file.exists()) {
                                    Files.copy(is, file.toPath());
                                    System.out.println("COPYING FILES");
                                }
                            }
                            break;
                    }
                }
        }
    }

    private String getFileName(Part part) throws IOException {
        try (BufferedReader r = new BufferedReader(new InputStreamReader(part.getInputStream()))) {
            return r.readLine();
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            processRequest(request, response);
        } catch (MWException ex) {
            Logger.getLogger(UploaderServlet.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @Override
    public String getServletInfo() {
        return "Short description";
    }
}
