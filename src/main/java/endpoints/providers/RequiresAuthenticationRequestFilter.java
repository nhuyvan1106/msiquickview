package endpoints.providers;

import endpoints.annotations.RequiresAuthentication;
import java.io.IOException;
import javax.ws.rs.container.*;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.ext.Provider;
import org.apache.shiro.SecurityUtils;

@Provider
@RequiresAuthentication
public class RequiresAuthenticationRequestFilter implements ContainerRequestFilter {

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        if (!SecurityUtils.getSubject().isAuthenticated())
            requestContext.abortWith(Response.status(Status.UNAUTHORIZED).build());
    }
    
}