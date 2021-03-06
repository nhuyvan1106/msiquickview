package security;

import javax.servlet.*;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.*;
import org.apache.shiro.authc.*;
import org.apache.shiro.subject.Subject;
import org.apache.shiro.web.filter.authc.FormAuthenticationFilter;
import security.exceptions.ForeignHostException;

@WebFilter(asyncSupported = true)
public class MsiQuickViewFormAuthenticationFilter extends FormAuthenticationFilter {

    @Override
    protected AuthenticationToken createToken(ServletRequest request, ServletResponse response) {
        String username = request.getParameter("username");
        char[] password = request.getParameter("password").toCharArray();
        String host = request.getRemoteAddr();
        return new HostAuthenticationToken(username, password, host) {};
    }

    @Override
    protected boolean onLoginSuccess(AuthenticationToken token, Subject subject, ServletRequest request, ServletResponse response) throws Exception {
        ((HttpServletResponse)response).sendRedirect("/msiquickview");
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