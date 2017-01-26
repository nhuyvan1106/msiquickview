package endpoints.filters;

import endpoints.annotations.RequiresAdmin;
import java.io.IOException;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.ext.Provider;
import org.apache.shiro.SecurityUtils;

@Provider
@RequiresAdmin
public class RequiresAdminRequestFilter implements ContainerRequestFilter {

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        System.out.println(this.getClass().getName() + ": SecurityUtils.getSubject().hasRole(\"ADMIN\"): " + SecurityUtils.getSubject().hasRole("ADMIN"));
        if (!SecurityUtils.getSubject().hasRole("ADMIN"))
            requestContext.abortWith(Response.status(Status.NOT_FOUND).build());
    }
    
}
