package endpoints;

import java.io.*;
import java.util.*;
import javax.inject.*;
import javax.json.*;
import javax.naming.*;
import javax.ws.rs.*;
import security.models.*;
import security.services.*;

@Path("questions")
@Singleton
public class QuestionResourse {

    @Inject
    private JPASecurityQuestionService questionService;

    @GET
    public JsonObject getQuestions() throws NamingException, IOException {
        return Json.createObjectBuilder()
                .add("payload", toJsonArray(questionService.findAll()))
                .build();
    }

    private JsonArrayBuilder toJsonArray(List<SecurityQuestion> questions) {
        return questions.stream()
                .map(this::toObjectBuilder)
                .collect(Json::createArrayBuilder, JsonArrayBuilder::add, JsonArrayBuilder::add);
    }

    private JsonObjectBuilder toObjectBuilder(SecurityQuestion question) {
        return Json.createObjectBuilder()
                .add("primaryKey", question.getId())
                .add("questionContent", question.getQuestion());
    }
}
