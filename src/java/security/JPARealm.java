package security;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;
import security.services.JPAAccountService;
import security.models.Account;
import java.util.logging.*;
import javax.naming.*;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.*;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.crypto.hash.Sha256Hash;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.util.ByteSource;
import security.exceptions.ForeignHostException;
import security.models.Account.Status;
import utils.EJBLocator;
import utils.EJBLocator.Type;

public class JPARealm extends AuthorizingRealm {

    private JPAAccountService userBean;
    private Account storedAccount = null;
    public JPARealm() {
        try {
            super.setAuthenticationCachingEnabled(true);
            super.setCredentialsMatcher(new Sha256PasswordMatcher());
            InitialContext ctx = new InitialContext();
            userBean = EJBLocator.getBean(Type.JPAAccountService);
        } catch (NamingException ex) {
            Logger.getLogger(JPARealm.class.getName()).log(Level.SEVERE, null, ex);
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
        if (!((HostAuthenticationToken)token).getHost().equals(storedAccount.getHost()) && credentialsMatchResult)
            throw new ForeignHostException(token.getPrincipal().toString(), storedAccount.getUsername());
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
