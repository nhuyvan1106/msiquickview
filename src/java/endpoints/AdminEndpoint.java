package endpoints;

import endpoints.annotations.RequiresAdmin;
import endpoints.annotations.RequiresAuthentication;
import java.util.function.Predicate;
import javax.json.*;
import javax.naming.NamingException;
import javax.ws.rs.*;
import javax.ws.rs.Path;
import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import javax.ws.rs.core.Response;
import security.models.Account;
import security.models.SecurityQuestion;
import security.services.*;
import utils.EJBLocator;

@Path("admin")
@RequiresAuthentication
@RequiresAdmin
public class AdminEndpoint {

    private final JPASecurityQuestionService questionService;
    private final JPAAccountService accountService;

    public AdminEndpoint() throws NamingException {
        this.accountService = EJBLocator.getBean(EJBLocator.Type.JPAAccountService);
        this.questionService = EJBLocator.getBean(EJBLocator.Type.JPASecurityQuestionService);
    }

    /*
     * ****************** QUESTIONS RELATED OPERATIONS *******************
     */
    @Path("accounts")
    @Produces(APPLICATION_JSON)
    @GET
    public JsonObject getAccounts(@QueryParam("excludes") String excludes, @QueryParam("statusFilter") String statusFilter) throws NamingException {

        Predicate<Account>[] filter = new Predicate[1];
        filter[0] = account -> true;
        switch (statusFilter) {
            case "ACTIVE":
                filter[0] = account -> account.getStatus() == Account.Status.ACTIVE;
                break;
            case "DISABLED":
                filter[0] = account -> account.getStatus() == Account.Status.DISABLED;
                break;
            case "LOCKED":
                filter[0] = account -> account.getStatus() == Account.Status.LOCKED;
                break;
        }
        JsonArrayBuilder arrayBuilder = accountService.findAll()
                .stream()
                .filter(account -> filter[0].test(account) && account.getUserRole() != Account.Role.ADMIN && excludes.indexOf(account.getUsername()) == -1)
                .limit(10)
                .map(this::toJsonObjectBuilder)
                .reduce(Json.createArrayBuilder(), JsonArrayBuilder::add, JsonArrayBuilder::add);

        return Json.createObjectBuilder()
                .add("payload", arrayBuilder)
                .add("total", accountService.count())
                .build();
    }

    @Path("accounts/{username}")
    @Produces(APPLICATION_JSON)
    @Consumes(APPLICATION_JSON)
    @GET
    public JsonObject getAccount(@PathParam("username") String username) throws NamingException {
        Account account = accountService.find(username);
        if (account == null || account.getUserRole() == Account.Role.ADMIN) {
            return Json.createObjectBuilder().add("found", false).build();
        }
        return toJsonObjectBuilder(account).add("found", true).build();
    }

    @Path("accounts/{username}")
    @PUT
    @Consumes(APPLICATION_JSON)
    public Response editAccountDetail(@PathParam("username") String username, JsonObject payload) throws NamingException {
        Account userAccount = accountService.find(username);
        if (userAccount == null) {
            return Response.notModified().build();
        }
        userAccount.setEmail(payload.getString("email"));
        userAccount.setStatus(Account.Status.valueOf(payload.getString("status")));
        accountService.edit(userAccount);
        accountService.evict(userAccount.getUsername());
        return Response.noContent().build();
    }

    @Path("accounts/{username}")
    @DELETE
    public Response deleteAccount(@PathParam("username") String username) throws NamingException {
        Account accountToDelete = accountService.find(username);
        accountService.remove(accountToDelete);
        return Response.noContent().build();
    }

    /*
     * ****************** QUESTIONS RELATED OPERATIONS *******************
     */
    
    @Path("questions")
    @Produces(APPLICATION_JSON)
    @POST
    public JsonObject addQuestion(@FormParam("questionContent") String questionContent) throws NamingException {
        SecurityQuestion question = new SecurityQuestion(questionContent);
        questionService.create(question);
        return Json.createObjectBuilder()
                .add("primaryKey", question.getId())
                .add("questionContent", questionContent)
                .build();
    }

    @Path("questions/{questionId}")
    @PUT
    public Response editQuestion(@PathParam("questionId") short questionId, @FormParam("question") String question) throws NamingException {
        SecurityQuestion storedQuestion = questionService.find(questionId);
        storedQuestion.setQuestion(question);
        questionService.edit(storedQuestion);
        questionService.evict(questionId);
        return Response.noContent().build();
    }

    @Path("questions/{questionId}")
    @DELETE
    public Response deleteQuestion(@PathParam("questionId") short questionId) throws NamingException {
        SecurityQuestion storedQuestion = questionService.find(questionId);
        questionService.remove(storedQuestion);
        return Response.noContent().build();
    }

    private JsonObjectBuilder toJsonObjectBuilder(Account account) {
        return Json.createObjectBuilder()
                .add("primaryKey", account.getUsername())
                .add("email", account.getEmail())
                .add("role", account.getUserRole().toString())
                .add("status", account.getStatus().toString())
                .add("lastAccessedTime", account.getLastAccessedTime());
    }
}
