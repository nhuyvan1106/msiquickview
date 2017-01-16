package security;

import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.AuthenticationException;
import security.models.Account;

public class Permission {

    public enum ResourceType {
        Account;

        @Override
        public String toString() {
            return this.name().toLowerCase();
        }
    }
    private static final String VIEW = "view";
    private static final String EDIT = "edit";
    private static final String DELETE = "delete";

    // "account:{username|*}:actions
    public static String getPermissionString(Account account, Permission.ResourceType resourceType) {
        StringBuilder permissionStr = new StringBuilder();

        switch (account.getUserRole()) {
            case ADMIN:
                return permissionStr.append(resourceType.toString()).append(':')
                        .append('*').append(':')
                        .append(VIEW).append(',')
                        .append(EDIT).append(',')
                        .append(DELETE)
                        .toString();

            case REGULAR:
                return permissionStr.append("account").append(':')
                        .append(account.getUsername()).append(':')
                        .append(VIEW).append(',')
                        .append(EDIT)
                        .toString();
            default:
                throw new IllegalStateException("Unknown resource type for permission string");
        }

    }
    
    public static boolean isAuthenticated() {
        if (!SecurityUtils.getSubject().isAuthenticated())
            throw new AuthenticationException();
        return true;
    }
    
    public static boolean isAdmin(Account account) {
        if (!((account.getUsername().equals("vann363") || account.getUsername().equals("thom991")) && account.getUserRole() == Account.Role.ADMIN))
            throw new security.exceptions.NotAuthorizedException("You are not authorized to perform the action");
        return true;
    }
}
