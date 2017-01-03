package security;

import security.services.JPAAccountService;
import security.models.Account;
import java.util.logging.*;
import javax.naming.*;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.*;
import org.apache.shiro.crypto.hash.Sha256Hash;
import org.apache.shiro.realm.AuthenticatingRealm;
import org.apache.shiro.util.ByteSource;
import security.exceptions.ForeignHostException;
import security.models.Account.Status;
import utils.EJBLocator;
import utils.EJBLocator.Type;

public class JPARealm extends AuthenticatingRealm {

    private JPAAccountService userBean;
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
        Account storedAccount = userBean.find(token.getPrincipal());
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
        return new SimpleAccount(storedAccount.getUsername(), storedAccount.getPassword(),
                                ByteSource.Util.bytes(storedAccount.getSalt()), this.getName());
    }
    
    private boolean compareCredentials(Object submitted, Account account) {
        Sha256Hash hash = new Sha256Hash(submitted, account.getSalt(), 1024);
        return account.getPassword().equals(hash.toBase64());
    }
}
