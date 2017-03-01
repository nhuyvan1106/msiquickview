package endpoints;

import com.mathworks.toolbox.javabuilder.*;
import endpoints.annotations.RequiresAuthentication;
import java.io.*;
import java.nio.file.*;
import java.rmi.*;
import java.util.*;
import java.util.stream.IntStream;
import javax.annotation.*;
import javax.enterprise.concurrent.*;
import javax.enterprise.context.RequestScoped;
import javax.json.Json;
import javax.json.JsonArrayBuilder;
import javax.json.JsonObject;
import javax.servlet.http.*;
import javax.ws.rs.*;
import javax.ws.rs.Path;
import javax.ws.rs.core.*;
import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import org.apache.shiro.SecurityUtils;
import org.slf4j.LoggerFactory;
import remote_proxy.Task;
import static resource.ApplicationResource.FILE_STORAGE_LOCATION;
import rmi.tasks.*;
import static utils.JsonWrapper.*;

@Path("data")
@RequestScoped
@RequiresAuthentication
@Produces(APPLICATION_JSON)
public class DataFetcherEndpoint {

    @Resource(name = "java:comp/DefaultManagedExecutorService")
    private ManagedExecutorService pool;

    @Context
    private HttpServletRequest request;

    @QueryParam("datasetName")
    private String datasetName;

    @QueryParam("fileType")
    private String fileType;

    @QueryParam("fileName")
    private String fileName;

    private Task<Object[]> task = null;
    private java.nio.file.Path datasetDir;

    @PostConstruct
    protected void init() {
        datasetDir = Paths.get(System.getProperty("user.home"), FILE_STORAGE_LOCATION, SecurityUtils.getSubject().getPrincipal().toString(), datasetName);
    }

    @PreDestroy
    protected void destroy() {
        if (task != null) {
            MWArray.disposeArray(task);
            task = null;
        }
    }

    @Path("graph/new")
    @GET
    public JsonObject load() throws MWException, RemoteException, NotBoundException {
        Object[] result = getReadResult(request, pool);
        int[] totalIntensity = cast(result[0]).getIntData();
        double[] scanTime = cast(result[1]).getDoubleData();
        int[] pointCount = cast(result[4]).getIntData();
        int sum = IntStream.of(pointCount).limit(20).sum();
        int[] intensityValues = Arrays.copyOfRange(cast(result[2]).getIntData(), 0, sum);
        int[] massValues = Arrays.copyOfRange(cast(result[3]).getIntData(), 0, sum);
       return Json.createObjectBuilder()
                .add("pointCount", createJsonArray(pointCount))
                .add("totalIntensity", createJsonArray(totalIntensity))
                .add("scanTime", createJsonArray(scanTime))
                .add("intensityValues", createJsonArray(intensityValues))
                .add("massValues", createJsonArray(massValues))
                .build();
    }

    @Path("graph/more")
    @GET
    public JsonObject loadMore(
            @QueryParam("nextSum") int nextSum,
            @QueryParam("offset") int offset,
            @QueryParam("direction") String direction) throws MWException, RemoteException, NotBoundException {
        Object[] result = getReadResult(request, pool);
        if (direction.equals("forward")) {
            return loadMore(result, offset, offset + nextSum);
        } else {
            return loadMore(result, offset - nextSum, offset);
        }
    }

    @Path("image")
    @GET
    public JsonObject getImageData() throws IOException {
        try (BufferedReader reader = Files.newBufferedReader(datasetDir.resolve("imageData/" + fileName + ".txt"))) {
            JsonArrayBuilder dataPerRow = reader.lines()
                    .map(line -> createJsonArray(line.split(",")))
                    .collect(Json::createArrayBuilder, JsonArrayBuilder::add, JsonArrayBuilder::add);
            return Json.createObjectBuilder()
                    .add("imageData", dataPerRow)
                    .build();
        }
    }

    @Path("ion-image")
    @GET
    public JsonObject getIonImageData(
            @QueryParam("lowerBound") double lowerBound,
            @QueryParam("upperBound") double upperBound,
            @QueryParam("fileNames") String fileNames) throws IOException, MWException, RemoteException, NotBoundException {
        java.nio.file.Path cdfHdfDir = datasetDir.resolve(fileType);
        String[] filesToGenerateImageFor = fileNames.split(",");
        for (int i = 0; i < filesToGenerateImageFor.length; i++) {
            filesToGenerateImageFor[i] = cdfHdfDir.resolve(filesToGenerateImageFor[i]).toString();
        }
        task = new IonImageGenerator(lowerBound, upperBound, filesToGenerateImageFor);
        Object[] result = runTask(task, "generate_ion_image_from_hdf-1.0.0.jar");
        MWNumericArray array = (MWNumericArray) result[0];
        return Json.createObjectBuilder()
                .add("dimension", createJsonArray(array.getDimensions()))
                .add("pixels", createJsonArray(array.getIntData()))
                .build();
    }

    @Path("roi/pixel-count")
    @GET
    public JsonObject countPixelsInROI(@QueryParam("selectedPixels") List<String> selectedPixels) throws MWException, RemoteException, NotBoundException {
        int[] pixels = selectedPixels.stream()
                .mapToInt(Integer::parseInt)
                .toArray();
        task = new PixelCountTask(pixels);
        Object size = runTask(task, "total_count_of_pixels_in_ROI-1.0.0.jar")[0];
        System.out.println("Result: " + size.toString());
        return Json.createObjectBuilder()
                .add("pixelCount", size.toString())
                .build();
    }

    private Object[] getReadResult(final HttpServletRequest request, final ManagedExecutorService pool) throws RemoteException, NotBoundException {
        final java.nio.file.Path cdfHdfFilePath = datasetDir.resolve(fileType + "/" + fileName);
        Object[] result = (Object[]) request.getSession().getAttribute(fileName);
        if (result == null) {
            try {
                task = new CdfHdfReaderTask(cdfHdfFilePath.toString());
                result = runTask(task, "cdf_read-1.0.0.jar");
                // Since cdf_read matlab function takes a long time to return the data for this cdf or hdf file
                // we cache the result in the session so we don't have to do it again.
                request.getSession().setAttribute(fileName, result);
            } catch (MWException ex) {
                LoggerFactory.getLogger(DataFetcherEndpoint.class.getName()).error(ex.getMessage());
            }
        }
        return result;
    }

    private MWNumericArray cast(Object o) {
        return (MWNumericArray) o;
    }

    private JsonObject loadMore(final Object[] result, final int start, final int end) {
        return Json.createObjectBuilder()
                .add("intensityValues", createJsonArray(Arrays.copyOfRange(cast(result[2]).getIntData(), start, end)))
                .add("massValues", createJsonArray(Arrays.copyOfRange(cast(result[3]).getIntData(), start, end)))
                .build();
    }

    private <T> T runTask(Task<T> task, String jar) throws RemoteException, NotBoundException {
        return Tasks.runTask(pool, task, request.getServletContext().getRealPath("/WEB-INF"), jar);
    }

}
