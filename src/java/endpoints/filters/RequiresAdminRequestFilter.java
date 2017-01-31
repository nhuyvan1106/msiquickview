package endpoints.filters;

import endpoints.annotations.RequiresAdmin;
import java.io.IOException;
import javax.ws.rs.container.*;
import javax.ws.rs.core.*;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.ext.Provider;
import org.apache.shiro.SecurityUtils;

@Provider
@RequiresAdmin
public class RequiresAdminRequestFilter implements ContainerRequestFilter {

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        if (!SecurityUtils.getSubject().hasRole("ADMIN"))
            requestContext.abortWith(Response.status(Status.NOT_FOUND).build());
    }
    
}
