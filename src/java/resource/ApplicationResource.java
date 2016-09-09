package resource;

import com.fasterxml.jackson.core.JsonFactory;
import javax.ejb.Lock;
import javax.ejb.LockType;
import javax.ejb.Startup;
import javax.inject.Singleton;

@Singleton
@Lock(value = LockType.READ)
@Startup
public class ApplicationResource {

    private final JsonFactory jsonFactory;
    private final String storage;
    private ApplicationResource() {
        jsonFactory = new JsonFactory();
        storage = "msi_quickview";
    }
    public String getStorage() {
        return storage;
    }

    public JsonFactory getJsonFactory() {
        return jsonFactory;
    }
}
