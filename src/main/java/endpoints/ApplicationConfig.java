package endpoints;

import javax.ws.rs.ApplicationPath;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;

@ApplicationPath("app")
public class ApplicationConfig extends ResourceConfig {

    public ApplicationConfig() {
        register(MultiPartFeature.class);
        packages("endpoints");
    }
}
