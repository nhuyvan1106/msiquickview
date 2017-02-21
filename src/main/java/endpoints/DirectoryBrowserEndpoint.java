package endpoints;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.ReadableByteChannel;
import java.nio.file.*;
import static java.nio.file.StandardOpenOption.READ;
import java.util.*;
import java.util.stream.Collectors;
import javax.annotation.PostConstruct;
import javax.enterprise.context.RequestScoped;
import javax.servlet.http.*;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.*;
import javax.ws.rs.Path;
import javax.ws.rs.core.*;
import org.apache.shiro.SecurityUtils;
import utils.JsonGeneratorWrapper;
import org.slf4j.LoggerFactory;
import static resource.ApplicationResource.*;
import static utils.FilesWrapper.*;

@Path("directory")
@RequestScoped
//@RequiresAuthentication
public class DirectoryBrowserEndpoint {

    @Context
    private HttpServletResponse response;

    private java.nio.file.Path userDir;

    @PathParam("datasetName")
    private String datasetName;

    @PostConstruct
    protected void init() {
        userDir = Paths.get(System.getProperty("user.home"), FILE_STORAGE_LOCATION, SecurityUtils.getSubject().getPrincipal().toString());
    }

    @Path("browse/{datasetName: (.*)?}")
    @GET
    public Response browse() throws IOException {
        if (list(userDir).isEmpty()) {
            return JsonGeneratorWrapper.newJsonObject(response)
                    .add("empty", true)
                    .add("message", "Nothing found")
                    .done(Response.ok().build());
        }
        if (!"".equals(datasetName) && !Files.exists(userDir.resolve(datasetName))) {
            return JsonGeneratorWrapper.newJsonObject(response)
                    .add("empty", true)
                    .add("message", "Dataset with provided name \"" + datasetName + "\" does not exist")
                    .done(Response.ok().build());
        }
        List<String> datasets = list(userDir);
        datasetName = "".equals(datasetName) ? datasets.get(0) : datasetName;
        java.nio.file.Path datasetDir = userDir.resolve(datasetName);
        List<String> ionImageNames = list(datasetDir.resolve("images"));
        List<String> opticalImageNames = list(datasetDir.resolve("optical"));
        List<String> roiImageNames = list(datasetDir.resolve("rois/roiImages"));
        return JsonGeneratorWrapper.newJsonObject(response)
                .add("datasets", datasets)
                .addEmbeddedObject("payload")
                .add("dataset", datasetName)
                .add("cdf", list(datasetDir.resolve("cdf")))
                .add("hdf", list(datasetDir.resolve("hdf")))
                .add("excel", list(datasetDir.resolve("excel")))
                // ion images (images folder)
                .add("images", ionImageNames.subList(0, getEndIndex(ionImageNames)))
                .add("ionImageData", getImageData(datasetDir.resolve("images"), ionImageNames, 10))
                .add("ionImageCount", ionImageNames.size())
                // optical images
                .add("optical", opticalImageNames.subList(0, getEndIndex(opticalImageNames)))
                .add("opticalImageData", getImageData(datasetDir.resolve("optical"), opticalImageNames, 10))
                .add("opticalImageCount", opticalImageNames.size())
                //ROI images
                .add("roiImages", roiImageNames.subList(0, getEndIndex(roiImageNames)))
                .add("roiImageData", getImageData(datasetDir.resolve("rois/roiImages"), roiImageNames, 10))
                .add("roiImageCount", roiImageNames.size())
                .buildEmbeddedObject()
                .done(Response.ok().build());
    }

    @Path("refresh/{datasetName}")
    public Response refresh(
            @DefaultValue("false") @QueryParam("restrict") boolean restrict,
            @QueryParam("folder") String folder) {
        java.nio.file.Path folderToRefresh = userDir.resolve(datasetName + "/" + folder);
        JsonGeneratorWrapper jsonWriter = JsonGeneratorWrapper.newJsonObject(response);
        jsonWriter.add("datasets", list(userDir));
        // restrict flag is used to figure out what we need to return, true -> count the files, else return the names of those files
        if (restrict) {
            jsonWriter.add("payload", list(folderToRefresh).size());
        } else {
            jsonWriter.add("payload", list(folderToRefresh));
        }
        return jsonWriter.done(Response.ok().build());
    }

    @Path("more/{datasetName}/images")
    public Response fetchMoreImages(
            @QueryParam("imageNames[]") List<String> existingImages,
            @QueryParam("limit") int limit,
            @QueryParam("imageFolder") String imageFolder) throws IOException {
        java.nio.file.Path imageFolderPath = userDir.resolve(datasetName + "/" + imageFolder);
        JsonGeneratorWrapper jsonWriter = JsonGeneratorWrapper.newJsonObject(response);
        List<String> allImages = list(imageFolderPath);
        jsonWriter.add("total", allImages.size());
        allImages.removeAll(existingImages);
        return jsonWriter.add("imageData", getImageData(imageFolderPath, allImages, limit))
                .add("imageNames", allImages.subList(0, limit < allImages.size() ? limit : allImages.size()))
                .done(Response.ok().build());
    }

    private List<String> getImageData(java.nio.file.Path parentDir, List<String> imageNames, int limit) throws IOException {
        Base64.Encoder encoder = Base64.getEncoder();
        return imageNames.stream()
                .limit(limit)
                .map(imageName -> parentDir.resolve(imageName))
                .map(file -> encodeImageDataHelper(file, encoder))
                .collect(Collectors.toList());
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
}
