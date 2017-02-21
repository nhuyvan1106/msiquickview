package endpoints;

import java.io.IOException;
import java.util.List;
import javax.inject.Inject;
import javax.inject.Singleton;
import utils.JsonGeneratorWrapper;
import javax.naming.NamingException;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import security.models.SecurityQuestion;
import security.services.JPASecurityQuestionService;

@Path("questions")
@Singleton
public class QuestionResourse {

    @Inject
    private JPASecurityQuestionService questionService;
    @Context
    private HttpServletResponse response;
    
    @GET
    public Response getQuestions() throws NamingException, IOException {
        System.out.println(response);
        return JsonGeneratorWrapper.newJsonObject(response)
                .addArray("payload", json -> writeArray(json, questionService.findAll()))
                .done(Response.ok().build());
    }

    private void writeArray(JsonGeneratorWrapper json, List<SecurityQuestion> questions) {
        System.out.println("json: " + json);
        System.out.println("questions: " + questions);
        questions.forEach(question -> json.addEmbeddedObject()
                .add("primaryKey", question.getId())
                .add("questionContent", question.getQuestion())
                .buildEmbeddedObject());
    }
}
