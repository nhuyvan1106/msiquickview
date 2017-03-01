package security;

import java.util.*;
import security.services.JPAAccountService;
import security.models.Account;
import javax.naming.*;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.*;
import org.apache.shiro.authz.*;
import org.apache.shiro.crypto.hash.Sha256Hash;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.util.ByteSource;
import org.slf4j.LoggerFactory;
import security.models.Account.Status;

public class JPARealm extends AuthorizingRealm {

    private JPAAccountService userBean;
    private Account storedAccount = null;
    public JPARealm() {
        try {
            super.setAuthenticationCachingEnabled(true);
            super.setCredentialsMatcher(new Sha256PasswordMatcher());
            InitialContext ctx = new InitialContext();
            userBean = (JPAAccountService)ctx.lookup("java:global/msiquickview-1.0.0/JPAAccountService");
        } catch (NamingException ex) {
            LoggerFactory.getLogger(JPARealm.class.getName()).error(ex.getMessage());
        }
    }

    @Override
    public String getName() {
        return "JPARealm";
    }

    @Override
    public boolean supports(AuthenticationToken token) {
        return true;
    }

    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) throws AuthenticationException {
        storedAccount = userBean.find(token.getPrincipal());
        if (storedAccount == null)
            throw new AuthenticationException();
        if (storedAccount.getStatus() == Status.DISABLED)
            throw new DisabledAccountException();
        if (storedAccount.getStatus() == Status.LOCKED)
            throw new LockedAccountException();
        boolean credentialsMatchResult = compareCredentials(token.getCredentials(), storedAccount);
//        if (!((HostAuthenticationToken)token).getHost().equals(storedAccount.getHost()) && credentialsMatchResult)
//            throw new ForeignHostException(token.getPrincipal().toString(), storedAccount.getUsername());
        if (!credentialsMatchResult)
            throw new AuthenticationException();
        storedAccount.setLastAccessedTime(new Date().getTime());
        userBean.edit(storedAccount);
        userBean.evict(storedAccount.getUsername());
        return new SimpleAccount(storedAccount.getUsername(), storedAccount.getPassword(),
                                ByteSource.Util.bytes(storedAccount.getSalt()), this.getName());
    }
    
    private boolean compareCredentials(Object submitted, Account account) {
        Sha256Hash hash = new Sha256Hash(submitted, account.getSalt(), 1024);
        return account.getPassword().equals(hash.toBase64());
    }

    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        Set<String> roles = new HashSet<>(1);
        roles.add(storedAccount.getUserRole().toString());
        SimpleAuthorizationInfo authzInfo = new SimpleAuthorizationInfo(roles);

        return authzInfo;
    }
}