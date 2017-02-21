package security.exceptions;

import org.apache.shiro.ShiroException;

/**
 *
 * @author NhuY
 */
public class NotAuthorizedException extends ShiroException {

    public NotAuthorizedException(String message) {
        super(message);
    }   
}