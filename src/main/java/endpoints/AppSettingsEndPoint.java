package endpoints;

import endpoints.annotations.RequiresAdmin;
import java.io.IOException;
import javax.inject.Singleton;
import utils.JsonGeneratorWrapper;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import resource.ApplicationResource;


@Path("settings")
@Singleton
@RequiresAdmin
public class AppSettingsEndPoint {
        
    @Context
    private HttpServletResponse response;
    
    @GET
    public Response getSettings() throws IOException {
        return JsonGeneratorWrapper.newJsonObject(response)
                .add("pushImageDataToES", ApplicationResource.Settings.isPushImageDataToES())
                .done(Response.ok().build());
    }
    
    @Path("{settingKey}")
    @PUT
    public void updateSetting(@PathParam("settingKey") String key, @FormParam("value") boolean newValue){
        switch (key) {
            case "pushImageDataToES":
                ApplicationResource.Settings.setPushImageDataToES(newValue);
                break;
        }
    }
}
