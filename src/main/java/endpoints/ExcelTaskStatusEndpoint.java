package endpoints;

import java.io.IOException;
import java.net.URL;
import javax.json.Json;
import javax.json.stream.*;
import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;

@ServerEndpoint("/excel-task-status")
public class ExcelTaskStatusEndpoint {

    @OnMessage
    public void messageReceived(Session session, String message) throws IOException {
        try (JsonParser parser = Json.createParser(new URL("http://localhost:9200/nanodesi/_search").openStream())) {
            while (parser.hasNext()) {
                if (parser.next() == JsonParser.Event.KEY_NAME && parser.getString().equals("time-remaining")) {
                    parser.next();
                    session.getBasicRemote().sendText(String.valueOf(parser.getInt()));
                    break;
                }
            }
        }
    }
}
