package security.exceptions;

import org.apache.shiro.authc.AuthenticationException;

public class ForeignHostException extends AuthenticationException {

    private final String submittedHost;
    private final String storedHost;

    public ForeignHostException(String submittedHost, String storedHost) {
        this.submittedHost = submittedHost;
        this.storedHost = storedHost;
    }
    
    @Override
    public String getMessage() {
        return "Submitted host: [ " + submittedHost + " ] does not match stored host: [ " + storedHost + " ]";
    }
    
}
