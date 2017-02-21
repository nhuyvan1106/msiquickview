package endpoints;

import endpoints.annotations.RequiresAdmin;
import java.io.IOException;
import java.util.List;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import javax.inject.Inject;
import javax.inject.Singleton;
import javax.json.JsonObject;
import javax.naming.NamingException;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.*;
import javax.ws.rs.Path;
import javax.ws.rs.core.Context;
import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import javax.ws.rs.core.Response;
import security.models.Account;
import security.models.SecurityQuestion;
import security.services.*;
import utils.JsonGeneratorWrapper;

@Path("admin")
@RequiresAdmin
@Singleton
public class AdminEndpoint {

    @Inject
    private JPASecurityQuestionService questionService;
    @Inject
    private JPAAccountService accountService;
    @Context
    private HttpServletResponse response;
    
    /*
     * ****************** QUESTIONS RELATED OPERATIONS *******************
     */
    @Path("accounts")
    @GET
    public Response getAccounts(@QueryParam("excludes") String excludes, @QueryParam("statusFilter") String statusFilter) throws NamingException, IOException {
        Predicate<Account>[] filter = new Predicate[1];
        System.out.println(response);
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
        List<Account> accounts = accountService.findAll()
                .stream()
                .filter(account -> filter[0].test(account) && account.getUserRole() != Account.Role.ADMIN && excludes.indexOf(account.getUsername()) == -1)
                .limit(10)
                .collect(Collectors.toList());

        return JsonGeneratorWrapper.newJsonObject(response)
                .addArray("payload", json -> accounts.forEach(account -> writeJson(json, account)))
                .add("total", accountService.count())
                .done(Response.ok().build());
    }

    @Path("accounts/{username}")
    @Consumes(APPLICATION_JSON)
    @GET
    public Response getAccount(@PathParam("username") String username) throws NamingException, IOException {
        Account account = accountService.find(username);
        if (account == null || account.getUserRole() == Account.Role.ADMIN) {
            return JsonGeneratorWrapper.newJsonObject(response)
                    .add("found", false)
                    .done(Response.ok().build());
        }
        else
            return writeJson(JsonGeneratorWrapper.newJsonObject(response), account)
                    .add("found", true)
                    .done(Response.ok().build());
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
    @POST
    public Response addQuestionAndGet(@FormParam("questionContent") String questionContent) throws NamingException, IOException {
        SecurityQuestion question = new SecurityQuestion(questionContent);
        questionService.create(question);
        return JsonGeneratorWrapper.newJsonObject(response)
                .add("primaryKey", question.getId())
                .add("questionContent", questionContent)
                .done(Response.ok().build());
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

    private JsonGeneratorWrapper writeJson(JsonGeneratorWrapper json, Account account) {
        json.addEmbeddedObject()
                .add("primaryKey", account.getUsername())
                .add("email", account.getEmail())
                .add("role", account.getUserRole().toString())
                .add("status", account.getStatus().toString())
                .add("lastAccessedTime", account.getLastAccessedTime())
                .buildEmbeddedObject();
        return json;
    }
}
