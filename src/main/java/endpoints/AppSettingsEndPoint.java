package endpoints;

import endpoints.annotations.*;
import java.io.*;
import javax.inject.*;
import javax.json.*;
import javax.ws.rs.*;
import static javax.ws.rs.core.MediaType.*;
import resource.*;

@Path("settings")
@Singleton
@RequiresAdmin
public class AppSettingsEndPoint {

    @GET
    @Produces(APPLICATION_JSON)
    public JsonObject getSettings() throws IOException {
        return Json.createObjectBuilder()
                .add("pushImageDataToES", ApplicationResource.Settings.isPushImageDataToES())
                .build();
    }

    @Path("{settingKey}")
    @PUT
    public void updateSetting(@PathParam("settingKey") String key, @FormParam("value") boolean newValue) {
        switch (key) {
            case "pushImageDataToES":
                ApplicationResource.Settings.setPushImageDataToES(newValue);
                break;
        }
    }
}
