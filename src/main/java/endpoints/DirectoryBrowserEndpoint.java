package endpoints;

import endpoints.annotations.*;
import java.io.*;
import java.nio.*;
import java.nio.channels.*;
import java.nio.file.*;
import static java.nio.file.StandardOpenOption.*;
import java.util.*;
import javax.annotation.*;
import javax.enterprise.context.*;
import javax.json.*;
import javax.ws.rs.*;
import javax.ws.rs.Path;
import javax.ws.rs.core.*;
import static javax.ws.rs.core.MediaType.*;
import org.apache.shiro.*;
import org.slf4j.*;
import static resource.ApplicationResource.*;
import static utils.FilesWrapper.*;
import static utils.JsonWrapper.*;

@Path("directory")
@RequestScoped
@RequiresAuthentication
@Produces(APPLICATION_JSON)
public class DirectoryBrowserEndpoint {

    private java.nio.file.Path userDir;

    @PathParam("datasetName")
    private String datasetName;

    @PostConstruct
    protected void init() {
        userDir = Paths.get(System.getProperty("user.home"), FILE_STORAGE_LOCATION, SecurityUtils.getSubject().getPrincipal().toString());
    }

    @Path("browse/{datasetName: (.*)?}")
    @GET
    public Object browse() throws IOException {
        if (list(userDir).isEmpty()) {
            JsonObject json = Json.createObjectBuilder()
                    .add("empty", true)
                    .add("message", "Nothing found")
                    .build();
            return Response.status(404).entity(json).build();
        }
        if (!"".equals(datasetName) && !Files.exists(userDir.resolve(datasetName))) {
            JsonObject json = Json.createObjectBuilder()
                    .add("empty", true)
                    .add("message", "Dataset with provided name \"" + datasetName + "\" does not exist")
                    .build();
            return Response.status(404).entity(json).build();
        }
        List<String> datasets = list(userDir);
        datasetName = "".equals(datasetName) ? datasets.get(0) : datasetName;
        java.nio.file.Path datasetDir = userDir.resolve(datasetName);
        
        return Json.createObjectBuilder()
                .add("datasets", createJsonArray(datasets))
                .add("payload", getPayloadObject(datasetDir))
                .build();
    }

    @Path("refresh/{datasetName}")
    @GET
    public JsonObject refresh(
            @DefaultValue("false") @QueryParam("restrict") boolean restrict,
            @QueryParam("folder") String folder) {
        java.nio.file.Path folderToRefresh = userDir.resolve(datasetName + "/" + folder);
        JsonObjectBuilder jsonObjBuilder = Json.createObjectBuilder();
        jsonObjBuilder.add("datasets", createJsonArray(list(userDir)));
        // restrict flag is used to figure out what we need to return, true -> count the files, else return the names of those files
        if (restrict) {
            jsonObjBuilder.add("payload", list(folderToRefresh).size());
        } else {
            jsonObjBuilder.add("payload", createJsonArray(list(folderToRefresh)));
        }
        return jsonObjBuilder.build();
    }

    @Path("more/{datasetName}/images")
    @GET
    public JsonObject fetchMoreImages(
            @QueryParam("imageNames[]") List<String> existingImages,
            @QueryParam("limit") int limit,
            @QueryParam("imageFolder") String imageFolder) throws IOException {
        java.nio.file.Path imageFolderPath = userDir.resolve(datasetName + "/" + imageFolder);
        JsonObjectBuilder jsonObjBuilder = Json.createObjectBuilder();
        List<String> allImages = list(imageFolderPath);
        jsonObjBuilder.add("total", allImages.size());
        allImages.removeAll(existingImages);
        return jsonObjBuilder.add("imageData", getImageData(imageFolderPath, allImages, limit))
                .add("imageNames", createJsonArray(allImages.subList(0, limit < allImages.size() ? limit : allImages.size())))
                .build();
    }

    private JsonArrayBuilder getImageData(java.nio.file.Path parentDir, List<String> imageNames, int limit) throws IOException {
        Base64.Encoder encoder = Base64.getEncoder();
        return imageNames.stream()
                .limit(limit)
                .map(imageName -> parentDir.resolve(imageName))
                .map(file -> encodeImageDataHelper(file, encoder))
                .collect(Json::createArrayBuilder, JsonArrayBuilder::add, JsonArrayBuilder::add);
    }

    private static String encodeImageDataHelper(java.nio.file.Path file, Base64.Encoder encoder) {
        try (ReadableByteChannel rbc = Files.newByteChannel(file, READ)) {
            ByteBuffer buffer = ByteBuffer.allocate((int) Files.size(file));
            rbc.read(buffer);
            buffer.flip();
            return encoder.encodeToString(buffer.array());

        } catch (IOException ex) {
            LoggerFactory.getLogger(DirectoryBrowserEndpoint.class).error(ex.getMessage());
            return null;
        }
    }

    /**
     * Because a folder may not contain more than 10 files, and we want 10 to be
     * the minimum, this method is so used to check if the given list which
     * contains the file names in some folder has more than 10 elements, if so
     * just return 10, else, return all
     *
     * @param list
     * @return
     */
    private int getEndIndex(List<?> list) {
        return list.size() < 10 ? list.size() : 10;
    }

    private JsonObjectBuilder getPayloadObject(java.nio.file.Path datasetDir) throws IOException {
        List<String> ionImageNames = list(datasetDir.resolve("images"));
        List<String> opticalImageNames = list(datasetDir.resolve("optical"));
        List<String> roiImageNames = list(datasetDir.resolve("rois/roiImages"));
        return Json.createObjectBuilder()
                .add("dataset", datasetName)
                .add("cdf", createJsonArray(list(datasetDir.resolve("cdf"))))
                .add("hdf", createJsonArray(list(datasetDir.resolve("hdf"))))
                .add("excel", createJsonArray(list(datasetDir.resolve("excel"))))
                // ion images (images folder)
                .add("images", createJsonArray(ionImageNames.subList(0, getEndIndex(ionImageNames))))
                .add("ionImageData", getImageData(datasetDir.resolve("images"), ionImageNames, 10))
                .add("ionImageCount", ionImageNames.size())
                // optical images
                .add("optical", createJsonArray(opticalImageNames.subList(0, getEndIndex(opticalImageNames))))
                .add("opticalImageData", getImageData(datasetDir.resolve("optical"), opticalImageNames, 10))
                .add("opticalImageCount", opticalImageNames.size())
                //ROI images
                .add("roiImages", createJsonArray(roiImageNames.subList(0, getEndIndex(roiImageNames))))
                .add("roiImageData", getImageData(datasetDir.resolve("rois/roiImages"), roiImageNames, 10))
                .add("roiImageCount", roiImageNames.size());
    }
}
