package endpoints;

import endpoints.annotations.RequiresAuthentication;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;
import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.json.JsonObject;
import javax.naming.NamingException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.*;
import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import utils.JsonGeneratorWrapper;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.*;
import org.apache.shiro.crypto.SecureRandomNumberGenerator;
import org.apache.shiro.crypto.hash.Sha256Hash;
import org.apache.shiro.subject.Subject;
import security.models.Account;
import security.HostAuthenticationToken;
import security.models.AccountSecurityQuestion;
import security.services.*;

@Path("accounts")
@RequestScoped
public class AccountManagerEndpoint {

    @Inject
    private JPAAccountService accountService;

    @Inject
    private JPAQuestionAnswerService questionAnswerService;

    @Inject
    private JPASecurityQuestionService questionService;
    
    @Context
    private HttpServletResponse response;
    
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
    @RequiresAuthentication
    public Response getAccount() throws NamingException, IOException {
        Account storedAccount = getCurrentUser();
        return JsonGeneratorWrapper.newJsonObject(response)
                .add("primaryKey", storedAccount.getUsername())
                .add("email", storedAccount.getEmail())
                .addArray("questions", json -> writeArray(json, storedAccount.getAccountSecurityQuestionList()))
                .done(Response.ok().build());
    }

    @Path("{username}")
    @PUT
    @Consumes(APPLICATION_JSON)
    @RequiresAuthentication
    public Response editAccountDetail(@PathParam("username") String username, JsonObject payload) throws NamingException {
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
                    editAnswer(key, payload.getJsonObject(key), questionAnswerService, currentUser.getSalt());
                    break;
            }

        }
        accountService.edit(currentUser);
        accountService.evict(username);
        return Response.noContent().build();
    }

    @Path("{username}/authentication")
    @POST
    @Consumes(APPLICATION_JSON)
    @RequiresAuthentication
    public Response securityCheckBeforeEdit(JsonObject payload) throws NamingException {
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
            return Response.ok().build();
        }
        return Response.status(404).build();
    }

    private Account getCurrentUser() {
        return accountService.find(SecurityUtils.getSubject().getPrincipal());
    }

    private void editAnswer(String accountQuestionPrimaryKey, JsonObject answerObj, JPAQuestionAnswerService service, String salt) {
        AccountSecurityQuestion answer = service.find(Integer.parseInt(accountQuestionPrimaryKey));
        answer.setAnswer(new Sha256Hash(answerObj.getString("answer"), salt, 1024).toBase64());
        answer.setQuestionId(Short.parseShort(answerObj.getString("questionId")));
        service.edit(answer);
        service.evict(answer.getId());
    }

    private boolean isProvidedAnswerMatched(JsonObject answer, String salt) {
        return questionAnswerService.find(answer.getInt("accountQuestionPrimaryKey"))
                .getAnswer()
                .equals(new Sha256Hash(answer.getString("answer"), salt, 1024).toBase64());
    }

    private void writeArray(JsonGeneratorWrapper json, List<AccountSecurityQuestion> accountSecurityQuestionList) {
        accountSecurityQuestionList.forEach(e -> {
            json.addEmbeddedObject()
                    .add("accountQuestionPrimaryKey", e.getId())
                    .add("questionContent", questionService.find(e.getQuestionId()).getQuestion())
                    .add("questionId", e.getQuestionId())
                    .buildEmbeddedObject();
        });
    }
}
