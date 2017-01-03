package endpoints;

import java.net.*;
import java.util.List;
import java.util.stream.Collectors;
import javax.json.*;
import javax.naming.NamingException;
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
import security.models.AccountSecurityQuestion;
import security.services.*;
import utils.EJBLocator;
import static utils.EJBLocator.Type.*;

@Path("accounts")
public class AccountManagerEndPoint {

    private JPAAccountService accountService;
    private JPASecurityQuestionService questionService;
    
    @POST
    @Consumes(value = APPLICATION_JSON)
    @Path("registration")
    public Response newAccount(@Context UriInfo uriInfo, JsonObject data) throws URISyntaxException, NamingException {
        //TODO Remove
        System.out.println(data);
        accountService = EJBLocator.getBean(JPAAccountService);
        char[] password = data.getString("password").toCharArray();
        String salt = new SecureRandomNumberGenerator().nextBytes().toBase64();
        Sha256Hash hash = new Sha256Hash(password, salt, 1024);
        Account newUser = new Account(data.getString("username"), hash.toBase64(), data.getString("email"));
        newUser.setSalt(salt);
        newUser.setHost(uriInfo.getRequestUri().getHost());
        
        List<AccountSecurityQuestion> questions = data.getJsonArray("questions")
                                                    .getValuesAs(JsonObject.class)
                                                    .stream()
                                                    .map(object -> new AccountSecurityQuestion((short)object.getInt("id"), object.getString("answer"), newUser))
                                                    .collect(Collectors.toList());
        newUser.setAccountSecurityQuestionList(questions);
        accountService.create(newUser);
        Subject user = SecurityUtils.getSubject();
        try {
            user.login(new HostAuthenticationToken(newUser.getUsername(), password, newUser.getHost()));
            URI uri = new URI("/Java-Matlab-Integration");
            return Response.temporaryRedirect(uri).build();
        } catch (AuthenticationException ex) {
            System.out.println(ex.getMessage());
            return Response.status(401).build();
        }
    }
    
    @Path("questions")
    @Produces(APPLICATION_JSON)
    @GET
    public JsonObject getQuestions(@Context UriInfo uriInfo) throws NamingException {
        questionService = EJBLocator.getBean(JPASecurityQuestionService);
        JsonObjectBuilder jsonBuilder = Json.createObjectBuilder();
        questionService.findAll()
                .stream()
                .forEach(question -> jsonBuilder.add(question.getId() + "", question.getQuestion()));
        return jsonBuilder.build();
    }
    
    @Path("exists")
    @POST
    public Response isExisitingAccount(@FormParam("username") String username) throws NamingException {
        System.out.println(username);
        accountService = EJBLocator.getBean(JPAAccountService);
        Account account = accountService.find(username);
        if (account != null)
            return Response.status(444).build();
        return Response.ok().build();
    }
}
