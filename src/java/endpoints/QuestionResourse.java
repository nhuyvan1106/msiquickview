package endpoints;

import javax.json.Json;
import javax.json.JsonArrayBuilder;
import javax.json.JsonObject;
import javax.naming.NamingException;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import security.services.JPASecurityQuestionService;
import utils.EJBLocator;

@Path("questions")
public class QuestionResourse {
    private final JPASecurityQuestionService questionService;
    protected QuestionResourse() throws NamingException {
        questionService = EJBLocator.getBean(EJBLocator.Type.JPASecurityQuestionService);
    }
    
    @Path("")
    @Produces(APPLICATION_JSON)
    @GET
    public JsonObject getQuestions() throws NamingException {
        JsonArrayBuilder arrayBuilder = questionService.findAll()
                .stream()
                .map(question -> Json.createObjectBuilder().add("primaryKey", question.getId()).add("questionContent", question.getQuestion()))
                .reduce(Json.createArrayBuilder(), JsonArrayBuilder::add, JsonArrayBuilder::add);
        return Json.createObjectBuilder().add("payload", arrayBuilder).build();
    }
}
