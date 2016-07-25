/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package resource;

import com.fasterxml.jackson.core.JsonFactory;
import javax.ejb.Lock;
import javax.ejb.LockType;
import javax.inject.Singleton;

/**
 *
 * @author NhuY
 */
@Singleton
@Lock(value = LockType.READ)
public class ApplicationResourcePool {
    
    private final JsonFactory jsonFactory;
    
    private ApplicationResourcePool() {
        jsonFactory = new JsonFactory();
    }
    
    public JsonFactory getJsonFactory() {
        return jsonFactory;
    }
}
