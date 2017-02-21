package security;

import org.apache.shiro.authc.credential.HashedCredentialsMatcher;

public class Sha256PasswordMatcher extends HashedCredentialsMatcher {

    public Sha256PasswordMatcher() {
        super.setHashAlgorithmName("SHA-256");
        super.setStoredCredentialsHexEncoded(false);
        super.setHashIterations(1024);
    }
}
