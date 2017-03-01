package utils;

import java.util.Arrays;
import java.util.List;
import javax.json.Json;
import javax.json.JsonArrayBuilder;
import javax.json.JsonObjectBuilder;

/**
 *
 * @author NhuY
 */
public final class JsonWrapper {
        
    public static JsonArrayBuilder createJsonArray(int[] array) {
        return Arrays.stream(array)
                .collect(Json::createArrayBuilder, JsonArrayBuilder::add, JsonArrayBuilder::add);
    }
    public static JsonArrayBuilder createJsonArray(double[] array) {
        return Arrays.stream(array)
                .collect(Json::createArrayBuilder, JsonArrayBuilder::add, JsonArrayBuilder::add);
    }
    public static JsonArrayBuilder createJsonArray(String[] array) {
        return Arrays.stream(array)
                .collect(Json::createArrayBuilder, JsonArrayBuilder::add, JsonArrayBuilder::add);
    }
    public static JsonArrayBuilder createJsonArray(long[] array) {
        return Arrays.stream(array)
                .collect(Json::createArrayBuilder, JsonArrayBuilder::add, JsonArrayBuilder::add);
    }
    public static JsonArrayBuilder createJsonArray(JsonObjectBuilder[] objects) {
        JsonArrayBuilder outerMost = Json.createArrayBuilder();
        Arrays.stream(objects).forEach(object -> outerMost.add(object));
        return outerMost;
    }
    public static JsonArrayBuilder createJsonArray(List<String> list) {
        JsonArrayBuilder outerMost = Json.createArrayBuilder();
        list.forEach(object -> outerMost.add(object));
        return outerMost;
    }
    public static JsonArrayBuilder createNestedArrays(List<String[]> arrays) {
        JsonArrayBuilder outerMost = Json.createArrayBuilder();
        arrays.forEach(array -> outerMost.add(createJsonArray(array)));
        return outerMost;
    }
}
