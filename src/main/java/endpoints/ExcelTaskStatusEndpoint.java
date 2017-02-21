package endpoints;

import com.fasterxml.jackson.core.JsonParser;
import java.io.IOException;
import java.net.URL;
import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import static resource.ApplicationResource.JSON_FACTORY;

@ServerEndpoint("/excel-task-status")
public class ExcelTaskStatusEndpoint {

    @OnMessage
    public void messageReceived(Session session, String message) throws IOException, InterruptedException {
        try (JsonParser parser = JSON_FACTORY.createParser(new URL("http://localhost:9200/_search"))) {
            while (parser.nextToken() != null)
                if (parser.getCurrentName() != null)
                    if (parser.getCurrentName().equals("time-remaining")) {
                        parser.nextToken();
                        session.getBasicRemote().sendText(String.valueOf(parser.getIntValue()));
                    }
        }
    }
}
