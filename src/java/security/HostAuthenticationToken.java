package security;

import org.apache.shiro.authc.AuthenticationToken;

public class HostAuthenticationToken implements AuthenticationToken {

    private final String principal;
    private final Object credential;
    private final String host;

    public HostAuthenticationToken(String principal, Object credential, String host) {
        this.principal = principal;
        this.credential = credential;
        this.host = host;
    }

    @Override
    public Object getPrincipal() {
        return principal;
    }

    @Override
    public Object getCredentials() {
        return credential;
    }
    public String getHost() {
        return host;
    }
}
