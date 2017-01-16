package endpoints;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.*;
import java.util.stream.Collectors;
import javax.json.*;
import javax.naming.NamingException;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import javax.ws.rs.core.*;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.*;
import org.apache.shiro.crypto.SecureRandomNumberGenerator;
import org.apache.shiro.crypto.hash.Sha256Hash;
import org.apache.shiro.subject.Subject;
import security.models.Account;
import security.HostAuthenticationToken;
import security.Permission;
import security.models.AccountSecurityQuestion;
import security.services.*;
import utils.EJBLocator;
import static utils.EJBLocator.Type.*;

@Path("accounts")
public class AccountManagerEndPoint {

    private final JPAAccountService accountService;

    public AccountManagerEndPoint() throws NamingException {
        this.accountService = EJBLocator.getBean(JPAAccountService);
    }

    @POST
    @Consumes(value = APPLICATION_JSON)
    @Path("registration")
    public Response newAccount(@Context HttpServletRequest request, JsonObject data) throws NamingException {
        char[] password = data.getString("password").toCharArray();
        String salt = new SecureRandomNumberGenerator().nextBytes().toBase64();
        Sha256Hash hash = new Sha256Hash(password, salt, 1024);
        Account newUser = new Account(data.getString("username"), hash.toBase64(), data.getString("email"));
        newUser.setSalt(salt);
        newUser.setHost(request.getRemoteAddr());

        List<AccountSecurityQuestion> questions = data.getJsonArray("questions")
                .getValuesAs(JsonObject.class)
                .stream()
                .map(object -> new AccountSecurityQuestion((short) object.getInt("id"), new Sha256Hash(object.getString("answer"), salt, 1024).toBase64(), newUser))
                .collect(Collectors.toList());
        newUser.setAccountSecurityQuestionList(questions);
        accountService.create(newUser);
        Subject user = SecurityUtils.getSubject();
        try {
            user.login(new HostAuthenticationToken(newUser.getUsername(), password, newUser.getHost()));
            return Response.ok().build();
        } catch (AuthenticationException ex) {
            return Response.status(401).build();
        }
    }

    @Path("{username}")
    @GET
    @Produces(APPLICATION_JSON)
    public JsonObject getAccount() throws NamingException {
        Permission.isAuthenticated();
        Account storedAccount = getCurrentUser();
        return Json.createObjectBuilder()
                .add("primaryKey", storedAccount.getUsername())
                .add("email", storedAccount.getEmail())
                .add("questions", toJsonArrayBuilder(storedAccount.getAccountSecurityQuestionList()))
                .build();
    }

    @Path("{username}")
    @PUT
    @Consumes(APPLICATION_JSON)
    public Response editAccountDetail(@PathParam("username") String username, JsonObject payload) throws NamingException {
        Permission.isAuthenticated();
        Account currentUser = getCurrentUser();
        if (currentUser == null) {
            return Response.notModified().build();
        }

        for (String key : payload.keySet()) {
            switch (key) {
                case "email":
                    currentUser.setEmail(payload.getString("email"));
                    break;
                case "password-repeat":
                    currentUser.setPassword(new Sha256Hash(payload.getString("password-repeat").toCharArray(), currentUser.getSalt(), 1024).toBase64());
                    break;
                default:
                    JPAQuestionAnswerService questionAnswerService = EJBLocator.getBean(JPAQuestionAnswerService);
                    editAnswer(payload.getJsonObject(key), questionAnswerService, currentUser.getSalt());
                    break;
            }

        }
        accountService.edit(currentUser);
        accountService.evict(username);
        return Response.noContent().build();
    }

    @Path("{username}/validation")
    @POST
    @Consumes(APPLICATION_JSON)
    public Response securityCheckBeforeEdit(JsonObject payload) throws NamingException {
        Permission.isAuthenticated();
        Account currentUser = getCurrentUser();
        char[] password = payload.getString("password").toCharArray();
        List<JsonObject> answers = payload.getJsonArray("answers").getValuesAs(JsonObject.class);
        if (!currentUser.getPassword().equals(new Sha256Hash(password, currentUser.getSalt(), 1024).toBase64())
                || answers.stream().anyMatch(answer -> !isProvidedAnswerMatched(answer, currentUser.getSalt()))) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        return Response.ok().build();
    }

    @Path("exists")
    @POST
    public Response isExisitingAccount(@FormParam("username") String username) throws NamingException {
        Account account = accountService.find(username);
        if (account != null) {
            return Response.status(444).build();
        }
        return Response.ok().build();
    }

    private Account getCurrentUser() {
        return accountService.find(SecurityUtils.getSubject().getPrincipal());
    }

    private void editAnswer(JsonObject answerObj, JPAQuestionAnswerService service, String salt) {
        AccountSecurityQuestion answer = service.find(answerObj.getInt("primaryKey"));
        answer.setAnswer(new Sha256Hash(answerObj.getString("answer"), salt, 1024).toBase64());
        service.edit(answer);
        service.evict(answer.getId());
    }

    private boolean isProvidedAnswerMatched(JsonObject answer, String salt) {
        try {
            JPAQuestionAnswerService questionAnswerService = EJBLocator.getBean(JPAQuestionAnswerService);
            return questionAnswerService.find(answer.getInt("primaryKey"))
                    .getAnswer()
                    .equals(new Sha256Hash(answer.getString("answer"), salt, 1024).toBase64());
        } catch (NamingException ex) {
            Logger.getLogger(AccountManagerEndPoint.class.getName()).log(Level.SEVERE, null, ex);
            return false;
        }
    }

    private JsonArrayBuilder toJsonArrayBuilder(List<AccountSecurityQuestion> accountSecurityQuestionList) throws NamingException {
        JPASecurityQuestionService questionService = EJBLocator.getBean(JPASecurityQuestionService);
        return accountSecurityQuestionList.stream()
                .map(e -> Json.createObjectBuilder()
                        .add("primaryKey", e.getId())
                        .add("questionContent", questionService.find(e.getQuestionId()).getQuestion())
                )
                .reduce(Json.createArrayBuilder(), JsonArrayBuilder::add, JsonArrayBuilder::add);
    }
}
