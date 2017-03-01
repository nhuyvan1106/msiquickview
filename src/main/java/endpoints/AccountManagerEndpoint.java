package endpoints;

import endpoints.annotations.*;
import java.util.*;
import java.util.stream.*;
import javax.enterprise.context.*;
import javax.inject.*;
import javax.json.*;
import javax.servlet.http.*;
import javax.ws.rs.*;
import javax.ws.rs.core.*;
import static javax.ws.rs.core.MediaType.*;
import org.apache.shiro.*;
import org.apache.shiro.authc.*;
import org.apache.shiro.crypto.*;
import org.apache.shiro.crypto.hash.*;
import org.apache.shiro.subject.*;
import security.models.Account;
import security.HostAuthenticationToken;
import security.models.*;
import security.services.*;
import static utils.JsonWrapper.*;

@Path("accounts")
@RequestScoped
public class AccountManagerEndpoint {

    @Inject
    private JPAAccountService accountService;

    @Inject
    private JPAQuestionAnswerService questionAnswerService;

    @Inject
    private JPASecurityQuestionService questionService;

    @POST
    @Consumes(value = APPLICATION_JSON)
    @Path("registration")
    public Response newAccount(@Context HttpServletRequest request, JsonObject data) {
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
    @Produces(APPLICATION_JSON)
    public JsonObject getAccount() {
        Account storedAccount = getCurrentUser();
        return Json.createObjectBuilder()
                .add("primaryKey", storedAccount.getUsername())
                .add("email", storedAccount.getEmail())
                .add("questions", createJsonArray(toJsonObjectBuilderList(storedAccount.getAccountSecurityQuestionList())))
                .build();
    }

    @Path("{username}")
    @PUT
    @Consumes(APPLICATION_JSON)
    @RequiresAuthentication
    public Response editAccountDetail(@PathParam("username") String username, JsonObject payload) {
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
    public Response securityCheckBeforeEdit(JsonObject payload) {
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
    public Response isExisitingAccount(@FormParam("username") String username) {
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

    private JsonObjectBuilder[] toJsonObjectBuilderList(List<AccountSecurityQuestion> accountSecurityQuestionList) {
        return accountSecurityQuestionList.stream()
                .map(e
                        -> Json.createObjectBuilder()
                        .add("accountQuestionPrimaryKey", e.getId())
                        .add("questionContent", questionService.find(e.getQuestionId()).getQuestion())
                        .add("questionId", e.getQuestionId()))
                .toArray(JsonObjectBuilder[]::new);
    }
}
