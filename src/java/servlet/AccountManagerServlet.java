package servlet;

import com.fasterxml.jackson.core.JsonGenerator;
import java.io.IOException;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.inject.Inject;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.*;
import org.apache.shiro.crypto.SecureRandomNumberGenerator;
import org.apache.shiro.crypto.hash.Sha256Hash;
import org.apache.shiro.subject.Subject;
import resource.ApplicationResource;
import security.models.Account;
import security.models.SecurityQuestion;
import security.services.JPAAccountService;
import security.services.JPASecurityQuestionService;

/**
 *
 * @author NhuY
 */
@WebServlet(name = "AccountManagerServlet", urlPatterns = {"/security/accounts","/security/accounts/existing-account",
"/security/questions"
})
public class AccountManagerServlet extends HttpServlet {
    
    @Inject
    private JPAAccountService accountManager;
    
    @Inject
    private JPASecurityQuestionService questionService;
    
    @Inject
    private ApplicationResource res;
    
    private SecureRandomNumberGenerator secureGenerator;

    @Override
    public void init() throws ServletException {
        super.init();
        secureGenerator = new SecureRandomNumberGenerator();
    }
    
    
    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String username = request.getParameter("username");
        switch (request.getServletPath()) {
            case "/security/accounts":
                char[] password = request.getParameter("password").toCharArray();
                String salt = secureGenerator.nextBytes().toBase64();
                Sha256Hash hash = new Sha256Hash(password, salt, 1024);
                Account newUser = new Account(username,hash.toBase64(),request.getParameter("email"));
                newUser.setSalt(salt);
                newUser.setHost(request.getRemoteAddr());
                accountManager.create(newUser);
                Subject user = SecurityUtils.getSubject();
                try {
                    user.login(new UsernamePasswordToken(username, password));
                    response.sendRedirect("/Java-Matlab-Integration");
                }
                catch (AuthenticationException ex) {
                    response.setStatus(401);
                    System.out.println("ERROR");
                }
                break;
                
            case "/security/accounts/existing-account":
                Account account = accountManager.find(username);
                if (account != null)
                    response.sendError(444);
                else
                    response.setStatus(200);
                response.flushBuffer();
                break;
                
            case "/security/questions":
                response.setContentType("application/json");
                List<SecurityQuestion> questions = questionService.findAll();
                try (JsonGenerator gen = res.getJsonFactory().createGenerator(response.getWriter())) {
                    gen.writeStartObject();
                        questions.stream()
                                .forEach(question -> writeQuestion(gen, question));
                    gen.writeEndObject();
                }
                break;
                    
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    private void writeQuestion(JsonGenerator gen, SecurityQuestion question) {
        try {
            gen.writeStringField(question.getId() + "", question.getQuestion());
        } catch (IOException ex) {
            Logger.getLogger(AccountManagerServlet.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
}
