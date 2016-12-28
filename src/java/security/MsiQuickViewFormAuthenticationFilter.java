package security;

import javax.servlet.*;
import javax.servlet.http.*;
import org.apache.shiro.authc.*;
import org.apache.shiro.subject.Subject;
import org.apache.shiro.web.filter.authc.FormAuthenticationFilter;
import security.exceptions.ForeignHostException;

public class MsiQuickViewFormAuthenticationFilter extends FormAuthenticationFilter {

    @Override
    protected AuthenticationToken createToken(ServletRequest request, ServletResponse response) {
        String username = request.getParameter("username");
        char[] password = request.getParameter("password").toCharArray();
        String host = request.getRemoteAddr();
        return new HostAuthenticationToken(username, password, host);
    }

    
    @Override
    protected boolean onLoginSuccess(AuthenticationToken token, Subject subject, ServletRequest request, ServletResponse response) throws Exception {
        //TODO: If subject has role admin, redirect to admin console
        // TODO: Implement admin console UI
        ((HttpServletResponse)response).sendRedirect("/Java-Matlab-Integration");
        return true;
    }

    @Override
    protected boolean onLoginFailure(AuthenticationToken token, AuthenticationException e, ServletRequest request, ServletResponse response) {
        String errorMsg = null;
        // TODO: Add email sending feature
        if (e instanceof ForeignHostException)
            errorMsg = "Please check your email.";
        else if (e instanceof DisabledAccountException)
            errorMsg = "Please check your email.";
        else if (e instanceof LockedAccountException)
            errorMsg = "Please contact admin.";
        else
            errorMsg = "Please try again.";
        ((HttpServletRequest)request).setAttribute("loginFailureMsg", errorMsg);
        return true;
    } 
}
