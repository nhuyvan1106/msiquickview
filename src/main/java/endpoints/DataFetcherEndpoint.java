package endpoints;

import com.mathworks.toolbox.javabuilder.MWArray;
import com.mathworks.toolbox.javabuilder.MWException;
import com.mathworks.toolbox.javabuilder.MWNumericArray;
import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;
import java.util.Arrays;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.IntStream;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.annotation.Resource;
import javax.enterprise.concurrent.ManagedExecutorService;
import javax.enterprise.context.RequestScoped;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import utils.JsonGeneratorWrapper;
import org.apache.shiro.SecurityUtils;
import remote_proxy.Task;
import static resource.ApplicationResource.FILE_STORAGE_LOCATION;
import rmi.tasks.CdfHdfReaderTask;
import rmi.tasks.IonImageGenerator;
import rmi.tasks.PixelCountTask;
import rmi.tasks.Tasks;

@Path("data")
@RequestScoped
//@RequiresAuthentication
public class DataFetcherEndpoint {

    @Resource(name = "java:comp/DefaultManagedExecutorService")
    private ManagedExecutorService pool;

    @Context
    private HttpServletRequest request;

    @Context
    private HttpServletResponse response;

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
    public Response load() throws MWException, RemoteException, NotBoundException {
        Object[] result = getReadResult(request, pool);
        int[] totalIntensity = cast(result[0]).getIntData();
        double[] scanTime = cast(result[1]).getDoubleData();
        int[] pointCount = cast(result[4]).getIntData();
        int sum = IntStream.of(pointCount).limit(20).sum();
        int[] intensityValues = Arrays.copyOfRange(cast(result[2]).getIntData(), 0, sum);
        int[] massValues = Arrays.copyOfRange(cast(result[3]).getIntData(), 0, sum);
        return JsonGeneratorWrapper.newJsonObject(response)
                .add("pointCount", pointCount)
                .add("totalIntensity", totalIntensity)
                .add("scanTime", scanTime)
                .add("intensityValues", intensityValues)
                .add("massValues", massValues)
                .done(Response.ok().build());
    }

    @Path("graph/more")
    @GET
    public Response loadMore(
            @QueryParam("nextSum") int nextSum,
            @QueryParam("offset") int offset,
            @QueryParam("direction") String direction) throws MWException, RemoteException, NotBoundException {
        Object[] result = getReadResult(request, pool);
        if (direction.equals("forward")) {
            return loadMore(response, result, offset, offset + nextSum);
        } else {
            return loadMore(response, result, offset - nextSum, offset);
        }
    }

    @Path("image")
    @GET
    public Response getImageData() throws IOException {
        try (BufferedReader reader = Files.newBufferedReader(datasetDir.resolve("imageData/" + fileName + ".txt"))) {
            return JsonGeneratorWrapper.newJsonObject(response)
                    .addArray("imageData", json -> reader.lines().map(line -> line.split(",")).forEach(array -> json.addArray(array)))
                    .done(Response.ok().build());
        }
    }

    @Path("ion-image")
    @GET
    public Response getIonImageData(
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
        return JsonGeneratorWrapper.newJsonObject(response)
                .add("dimension", array.getDimensions())
                .add("pixels", array.getIntData())
                .done(Response.ok().build());
    }

    @Path("roi/pixel-count")
    @GET
    public Response countPixelsInROI(@QueryParam("selectedPixels") List<String> selectedPixels) throws MWException, RemoteException, NotBoundException {
        int[] pixels = selectedPixels.stream()
                .mapToInt(Integer::parseInt)
                .toArray();
        task = new PixelCountTask(pixels);
        Object size = runTask(task, "total_count_of_pixels_in_ROI-1.0.0.jar")[0];
        System.out.println("Result: " + size.toString());
        return Response.ok().build();
    }

    private Object[] getReadResult(final HttpServletRequest request, final ManagedExecutorService pool) throws RemoteException, NotBoundException {
        final java.nio.file.Path cdfHdfFilePath = datasetDir.resolve(fileType + "/" + fileName);
        Object[] result = (Object[]) request.getSession().getAttribute(fileName);
        System.out.println("getReadResult(): " + (result == null));
        if (result == null) {
            try {
                task = new CdfHdfReaderTask(cdfHdfFilePath.toString());
                result = runTask(task, "cdf_read-1.0.0.jar");
                // Since cdf_read matlab function takes a long time to return the data for this cdf or hdf file
                // we cache the result in the session so we don't have to do it again.
                request.getSession().setAttribute(fileName, result);
            } catch (MWException ex) {
                Logger.getLogger(DataFetcherEndpoint.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return result;
    }

    private MWNumericArray cast(Object o) {
        return (MWNumericArray) o;
    }

    private Response loadMore(final HttpServletResponse response, final Object[] result, final int start, final int end) {
        return JsonGeneratorWrapper.newJsonObject(response)
                .add("intensityValues", Arrays.copyOfRange(cast(result[2]).getIntData(), start, end))
                .add("massValues", Arrays.copyOfRange(cast(result[3]).getIntData(), start, end))
                .done(Response.ok().build());
    }

    private <T> T runTask(Task<T> task, String jar) throws RemoteException, NotBoundException {
        return Tasks.runTask(pool, task, request.getServletContext().getRealPath("/WEB-INF"), jar);
    }
}
