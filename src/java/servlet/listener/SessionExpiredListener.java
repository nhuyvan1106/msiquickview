package servlet.listener;

import com.mathworks.toolbox.javabuilder.MWArray;
import java.util.Enumeration;
import javax.servlet.annotation.WebListener;
import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;

// Because we store matlab navtive arrays inside the session and the JVM is not aware of these arrays.
// So they are not subject to the regular GC cycles.
// So we must release these resources when the session is ended.
@WebListener
public class SessionExpiredListener implements HttpSessionListener {

    @Override
    public void sessionCreated(HttpSessionEvent se) {
        
    }

    @Override
    public void sessionDestroyed(HttpSessionEvent se) {
        Enumeration<String> attrNames = se.getSession().getAttributeNames();
        while (attrNames.hasMoreElements()) {
            MWArray.disposeArray(se.getSession().getAttribute(attrNames.nextElement()));
        }
    }
    
}
