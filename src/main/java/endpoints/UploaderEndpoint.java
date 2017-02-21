package endpoints;

import com.mathworks.toolbox.javabuilder.*;
import endpoints.annotations.RequiresAuthentication;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.file.*;
import static java.nio.file.StandardOpenOption.*;
import java.rmi.*;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.*;
import static java.util.stream.Collectors.*;
import javax.annotation.*;
import javax.enterprise.concurrent.ManagedExecutorService;
import javax.enterprise.context.RequestScoped;
import javax.servlet.*;
import javax.ws.rs.*;
import javax.ws.rs.Path;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.container.*;
import javax.ws.rs.core.*;
import static javax.ws.rs.core.MediaType.MULTIPART_FORM_DATA;
import utils.ExcelFileParser;
import org.apache.poi.EncryptedDocumentException;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.*;
import org.apache.shiro.SecurityUtils;
import org.glassfish.jersey.media.multipart.*;
import org.slf4j.LoggerFactory;
import resource.ApplicationResource;
import static resource.ApplicationResource.FILE_STORAGE_LOCATION;
import rmi.tasks.*;
import static utils.FilesWrapper.*;

@Path("uploader")
@RequestScoped
@RequiresAuthentication
@Consumes(MULTIPART_FORM_DATA)
public class UploaderEndpoint {

    @Resource(name = "java:comp/DefaultManagedExecutorService")
    private ManagedExecutorService pool;

    @FormDataParam("datasetName")
    private String datasetName;

    private java.nio.file.Path datasetDir;
    private final String username = SecurityUtils.getSubject().getPrincipal().toString();

    @PostConstruct
    protected void init() {
        datasetDir = Paths.get(System.getProperty("user.home"), FILE_STORAGE_LOCATION, username, datasetName);
    }

    @POST
    @Path("cdf-hdf")
    public Response uploadCdfHdf(
            @FormDataParam("folder") String folder,
            @FormDataParam("opticalImage") FormDataBodyPart opticalImage,
            @FormDataParam("files") List<FormDataBodyPart> parts,
            @FormDataParam("esRequestBody") String esRequestBody) throws IOException, ServletException {
        if (datasetName == null || folder == null) {
            throw new WebApplicationException("Invalid input", Response.status(Response.Status.BAD_REQUEST).build());
        }
        java.nio.file.Path cdfHdfDir = datasetDir.resolve(folder);
        if (!Files.exists(cdfHdfDir)) {
            Files.createDirectories(cdfHdfDir.resolve("rois"));
            Stream.of("cdf", "hdf", "images", "excel", "optical", "rois/roiImages", "rois/points", "cluster", "overlays", "imageData")
                    .forEach(e -> cdfHdfDir.resolve(e).toFile().mkdir());
        }
        if (opticalImage != null) {
            saveFile(cdfHdfDir.resolve("optical/" + opticalImage.getContentDisposition().getFileName()), opticalImage.getValueAs(InputStream.class));
        }
        parts.forEach(part -> saveFile(cdfHdfDir.resolve(part.getContentDisposition().getFileName()), part.getValueAs(InputStream.class)));
        pool.submit(() -> pushToES(esRequestBody));
        return Response.ok().build();
    }

    @Path("images/generated")
    @POST
    public Response saveGeneratedImage(
            @FormDataParam("imageData") String base64ImageData,
            @FormDataParam("imageName") String imageName,
            @FormDataParam("rawImageData") List<FormDataBodyPart> rawImageDataPerRow,
            @FormDataParam("esRequestBody") String esRequestBody) throws IOException {
        java.nio.file.Path imageFilePath = datasetDir.resolve("images/" + imageName + "_.png");
        saveFile(imageFilePath, decodeBase64String(base64ImageData));

        java.nio.file.Path imageDataFilePath = datasetDir.resolve("imageData/" + imageName + "_.txt");
        try (BufferedWriter bWriter = Files.newBufferedWriter(imageDataFilePath, CREATE, APPEND)) {
            String dataString = rawImageDataPerRow.stream()
                    .map(FormDataBodyPart::getValue)
                    .collect(joining(System.getProperty("line.separator")));
            bWriter.write(dataString);
        }
        System.out.println("settings.isPushImageDataToES(): " + ApplicationResource.Settings.isPushImageDataToES());
        if (ApplicationResource.Settings.isPushImageDataToES()) {
            pool.submit(() -> pushToES(esRequestBody));
        }
        return Response.ok().build();
    }

    @Path("images/roi")
    @POST
    public Response saveRoiImage(
            @FormDataParam("roiImageName") String imageName,
            @FormDataParam("roiImageData") String base64ImageData,
            @FormDataParam("selectedPixels") String selectedPixels,
            @FormDataParam("esRequestBody") String esRequestBody) throws IOException {
        java.nio.file.Path imageFilePath = datasetDir.resolve("rois/roiImages/" + imageName + ".png");
        saveFile(imageFilePath, decodeBase64String(base64ImageData));
        java.nio.file.Path imageDataFilePath = datasetDir.resolve("rois/points/" + imageName + ".csv");
        try (BufferedWriter bWriter = Files.newBufferedWriter(imageDataFilePath, CREATE, WRITE, APPEND)) {
            bWriter.write("row,selected pixels");
            bWriter.newLine();
            for (String row : selectedPixels.split("\\s*-1\\s*")) {
                //first element of each row is the row number, subsequent elements are the selected pixels of this ROI
                bWriter.write(row.substring(0, 1) + "," + row.substring(1));
                bWriter.newLine();
            }
        }
        ApplicationResource.Settings settings = new ApplicationResource.Settings();
        if (settings.isPushImageDataToES()) {
            pool.submit(() -> pushToES(esRequestBody));
        }
        return Response.ok().build();
    }

    @Path("images/optical")
    @POST
    public Response saveOpticalImage(@FormDataParam("opticalImageFile") FormDataBodyPart opticalImagePart) {
        saveFile(datasetDir.resolve("optical/" + opticalImagePart.getContentDisposition().getFileName()), opticalImagePart.getValueAs(InputStream.class));
        return Response.ok().build();
    }

    @Path("excel")
    @POST
    public void generateImagesFromExcel(
            @Context ServletContext context,
            @Suspended AsyncResponse asyncResponse,
            @FormDataParam("fileType") String fileType,
            @FormDataParam("excelFile") FormDataBodyPart excelPart,
            @FormDataParam("threshold") @DefaultValue("1000") int threshold,
            @FormDataParam("esRequestBody") String esRequestBody) throws IOException, InvalidFormatException, MWException, RemoteException, NotBoundException {
        java.nio.file.Path excelFilePath = datasetDir.resolve("excel/" + excelPart.getContentDisposition().getFileName());
        if (!Files.exists(excelFilePath)) {
            saveFile(excelFilePath, excelPart.getValueAs(InputStream.class));
            pool.submit(() -> {
                try (Workbook wb = WorkbookFactory.create(excelFilePath.toFile())) {
                    List<String> fileNames = listFullPath(datasetDir.resolve(fileType));
                    double[][] ranges = ExcelFileParser.extractSheet(wb);
                    ImagesFromExcelTask task = new ImagesFromExcelTask(datasetDir.resolve("images").toString() + File.separator, fileNames, ranges, threshold, datasetDir.getFileName().toString());
                    Tasks.runTask(pool, task, context.getRealPath("/WEB-INF"), "save_ion_image_for_all_ranges_in_spreadsheet-1.0.0.jar");
                    ranges = null;
                    MWArray.disposeArray(task);
                    task = null;
                    asyncResponse.resume(Response.ok().entity(excelFilePath.getFileName().toString()).build());
                    pool.submit(() -> pushToES(esRequestBody));
                } catch (IOException | InvalidFormatException | EncryptedDocumentException | MWException | NotBoundException ex) {
                    LoggerFactory.getLogger(UploaderEndpoint.class).error(ex.getMessage());
                    ex.printStackTrace();
                    asyncResponse.resume(Response.serverError().build());
                }
            });
        } else {
            asyncResponse.resume(Response.ok().build());
        }
    }

    private InputStream decodeBase64String(String str) {
        return new ByteArrayInputStream(Base64.getDecoder().decode(str));
    }

    private void pushToES(String esRequestBody) {
        try {
            URL url = new URL("http://localhost:9200/msi_quickview/" + username + "/" + datasetName + "/_update");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setDoOutput(true);
            connection.setAllowUserInteraction(true);
            connection.setRequestMethod("POST");
            connection.connect();
            try (OutputStream os = connection.getOutputStream()) {
                os.write(esRequestBody.getBytes("UTF-8"));
            }
            System.out.println("RESPONSE: " + connection.getResponseMessage());
            System.out.println("DATA: " + esRequestBody);
            connection.disconnect();
        } catch (MalformedURLException ex) {
            Logger.getLogger(UploaderEndpoint.class.getName()).log(Level.SEVERE, null, ex);
        } catch (IOException ex) {
            Logger.getLogger(UploaderEndpoint.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
}
