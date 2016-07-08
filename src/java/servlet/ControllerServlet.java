package servlet;

import com.mathworks.toolbox.javabuilder.*;
import java.io.*;
import java.nio.file.Files;
import java.util.logging.*;
import javax.servlet.ServletException;
import javax.servlet.annotation.*;
import javax.servlet.http.*;

@WebServlet(name = "ControllerServlet", urlPatterns = {"/ControllerServlet/upload"})
@MultipartConfig
public class ControllerServlet extends HttpServlet {

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException, MWException {

        switch (request.getServletPath()) {
            case "/ControllerServlet/upload":
                String userDir = "";
                File userDirectory = null;
                for (Part part : request.getParts()) {
                    String fileName = part.getSubmittedFileName();
                    if (fileName == null) {
                        try (BufferedReader r = new BufferedReader(new InputStreamReader(part.getInputStream()))) {
                            userDir = r.readLine();
                            userDirectory = new File(request.getServletContext().getRealPath("/WEB-INF/temp") + File.separator + userDir);
                            if (!userDirectory.exists()) {
                                userDirectory.mkdir();
                            }
                        }
                        continue;
                    }
                    File file = new File(userDirectory.toString() + File.separator + fileName);
                    try (InputStream is = part.getInputStream()) {
                        if (!file.exists()) {
                            Files.copy(is, file.toPath());
                        }
                    }
                }
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
