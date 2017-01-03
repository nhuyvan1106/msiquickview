package endpoints;

import java.util.*;
import javax.ws.rs.ApplicationPath;
import javax.ws.rs.core.Application;

@ApplicationPath("security")
public class ApplicationConfig extends Application {
    private final Set<Class<?>> classes = new HashSet<>(1);

    public ApplicationConfig() {
        classes.add(AccountManagerEndPoint.class);
    }

    @Override
    public Set<Class<?>> getClasses() {
        return classes;
    }
    
}
