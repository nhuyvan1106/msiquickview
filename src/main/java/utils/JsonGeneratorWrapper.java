package utils;

import com.fasterxml.jackson.core.JsonEncoding;
import com.fasterxml.jackson.core.JsonGenerator;
import java.io.IOException;
import java.io.Writer;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import java.util.function.Consumer;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.http.HttpServletResponse;
import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import javax.ws.rs.core.Response;
import org.slf4j.LoggerFactory;
import static resource.ApplicationResource.*;

public class JsonGeneratorWrapper {

    private JsonGenerator generator = null;
    private HttpURLConnection connection = null;
    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(JsonGeneratorWrapper.class);

    private JsonGeneratorWrapper(Writer outSrc) {

        try {
            generator = JSON_FACTORY.createGenerator(outSrc);
            generator.writeStartObject();
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
        }
    }

    public static JsonGeneratorWrapper newJsonObject(HttpServletResponse response) {
        try {
            response.setContentType(APPLICATION_JSON);
            return new JsonGeneratorWrapper(response.getWriter());
        } catch (IOException ex) {
            Logger.getLogger(JsonGeneratorWrapper.class.getName()).log(Level.SEVERE, null, ex);
            return null;
        }
    }

    public JsonGeneratorWrapper add(String field, int number) {
        try {
            generator.writeNumberField(field, number);
            return this;
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return null;
        }
    }

    public JsonGeneratorWrapper add(String field, long number) {
        try {
            generator.writeNumberField(field, number);
            return this;
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return null;
        }
    }

    public JsonGeneratorWrapper add(String field, boolean truefalse) {
        try {
            generator.writeBooleanField(field, truefalse);
            return this;
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return null;
        }
    }

    public JsonGeneratorWrapper add(String field, String str) {
        try {
            generator.writeStringField(field, str);
            return this;
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return null;
        }
    }

    public JsonGeneratorWrapper add(String field, String[] strArray) {
        try {
            generator.writeArrayFieldStart(field);
            for (String str : strArray) {
                generator.writeString(str);
            }
            generator.writeEndArray();
            return this;
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return null;
        }
    }

    public JsonGeneratorWrapper add(String field, int[] intArray) {
        try {
            generator.writeArrayFieldStart(field);
            for (int i : intArray) {
                generator.writeNumber(i);
            }
            generator.writeEndArray();
            return this;
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return null;
        }
    }

    public JsonGeneratorWrapper add(String field, double[] doubleArray) {
        try {
            generator.writeArrayFieldStart(field);
            for (double i : doubleArray) {
                generator.writeNumber(i);
            }
            generator.writeEndArray();
            return this;
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return null;
        }
    }

    public JsonGeneratorWrapper add(String field, List<String> strList) {
        try {
            generator.writeArrayFieldStart(field);
            for (String str : strList) {
                generator.writeString(str);
            }
            generator.writeEndArray();
            return this;
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return null;
        }
    }

    public JsonGeneratorWrapper addEmbeddedObject(String field) {
        try {
            generator.writeObjectFieldStart(field);
            return this;
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return null;
        }
    }

    public JsonGeneratorWrapper addArray(String field, Consumer<JsonGeneratorWrapper> consumer) {
        try {
            generator.writeArrayFieldStart(field);
            consumer.accept(this);
            generator.writeEndArray();
            return this;
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return null;
        }
    }

    public JsonGeneratorWrapper addEmbeddedObject() {
        try {
            generator.writeStartObject();
            return this;
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return null;
        }
    }

    public JsonGeneratorWrapper buildEmbeddedObject() {
        try {
            generator.writeEndObject();
            return this;
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return null;
        }
    }

    public JsonGeneratorWrapper addArray(String[] strArray) {
        try {
            generator.writeStartArray();
            for (String str : strArray) {
                generator.writeString(str);
            }
            generator.writeEndArray();
            return this;
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return null;
        }
    }
    public JsonGeneratorWrapper addArray(List<?> list) {
        try {
            generator.writeStartArray();
            for (Object str : list) {
                generator.writeString(str.toString());
            }
            generator.writeEndArray();
            return this;
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return null;
        }
    }

    public Response done(Response response) {
        try {
            generator.writeEndObject();
            generator.close();
            return response;
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return Response.serverError().build();
        }
    }

    public void done() {
        try {
            generator.writeEndObject();
            generator.close();
            if (connection != null) {
                System.out.println(connection.getResponseMessage());
                System.out.println(connection.getContent());
                connection.disconnect();
            }
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
        }
    }
}
