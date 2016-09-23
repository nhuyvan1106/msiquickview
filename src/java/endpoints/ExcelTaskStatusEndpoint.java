package endpoints;

import com.fasterxml.jackson.core.JsonParser;
import java.io.IOException;
import java.net.URL;
import javax.inject.Inject;
import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import resource.ApplicationResource;

@ServerEndpoint("/excel-task-status")
public class ExcelTaskStatusEndpoint {

    @Inject
    private ApplicationResource resource;

    @OnMessage
    public void messageReceived(Session session, String message) throws IOException, InterruptedException {
        try (JsonParser parser = resource.getJsonFactory().createParser(new URL("http://localhost:9200/_search"))) {
            while (parser.nextToken() != null)
                if (parser.getCurrentName() != null)
                    if (parser.getCurrentName().equals("time-remaining")) {
                        parser.nextToken();
                        session.getBasicRemote().sendText(String.valueOf(parser.getIntValue()));
                    }
        }
    }
}
