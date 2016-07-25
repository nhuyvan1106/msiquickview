/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package json;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.function.Predicate;
import java.util.logging.*;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.output.ByteArrayOutputStream;

public class JsonWriter {

    private JsonWriter() {
    }

    public static void main(String[] args) throws IOException {
        writeUserDir(new JsonFactory().createJsonGenerator(System.out).useDefaultPrettyPrinter(), "C:\\Users\\NhuY\\Desktop\\Java-Matlab-Integration\\build\\web\\WEB-INF\\temp\\vann363", null);
    }

    public static void writeUserDir(JsonGenerator generator, String userDir, String datasetName) throws FileNotFoundException {
        Predicate<File> p = null;
        if (!Files.exists(Paths.get(userDir))) {
            throw new FileNotFoundException("Folder with given name: " + userDir + " does not exist");
        }
        if (datasetName != null && !"".equals(datasetName)) {
            if (!Files.exists(Paths.get(userDir))) {
                throw new FileNotFoundException("Folder with given name: " + datasetName + " does not exist");
            }
            p = file -> file.getName().equals(datasetName);
        } else {
            p = file -> true;
        }
        try {
            File d = new File(userDir);
            generator.writeStartObject();
            writeArray(generator, "datasets", d);
            generator.writeArrayFieldStart("payload");
            Arrays.stream(d.listFiles())
                    .filter(file -> !file.isHidden())
                    .filter(p)
                    .limit(1)
                    .forEach(file -> writePayloadObject(generator, file));
            generator.writeEndArray();
            generator.writeEndObject();
            generator.close();
        } catch (IOException ex) {
            Logger.getLogger(JsonWriter.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    public static void writeImageData(JsonGenerator generator, String path, int limit) throws IOException {
        Base64.Encoder encoder = Base64.getEncoder();
        generator.writeArrayFieldStart("image-data");
        Arrays.stream(new File(path).listFiles())
                .filter(file -> !file.isHidden())
                .limit(limit)
                .map(file -> encodeImageDataHelper(file, encoder))
                .forEach(e -> {
                    try {
                        generator.writeString(e);
                    } catch (IOException ex) {
                        Logger.getLogger(JsonWriter.class.getName()).log(Level.SEVERE, null, ex);
                    }
                });
        generator.writeEndArray();
    }

    private static void writePayloadObject(JsonGenerator generator, File dir) {
        try {
            generator.writeStartObject();
            generator.writeStringField("dataset", dir.getName());
            for (File file : dir.listFiles())
                writeArray(generator, file.getName(), file);
            writeImageData(generator, dir.toString() + File.separator + "images", 10);
            generator.writeEndObject();
        } catch (IOException ex) {
            Logger.getLogger(JsonWriter.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    private static void writeArray(JsonGenerator generator, String field, File dir) {
        try {
            generator.writeArrayFieldStart(field);
            listFileNames(dir, generator);
            generator.writeEndArray();
        } catch (IOException ex) {
            Logger.getLogger(JsonWriter.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    private static void listFileNames(File dir, JsonGenerator generator) {
        Arrays.stream(dir.listFiles())
                .filter(file -> !file.isHidden())
                .map(File::getName)
                .forEach((text) -> {
                    try {
                        generator.writeString(text);
                    } catch (IOException ex) {
                        Logger.getLogger(JsonWriter.class.getName()).log(Level.SEVERE, null, ex);
                    }
                });
    }

    private static String encodeImageDataHelper(File file, Base64.Encoder encoder) {
        ByteArrayOutputStream os = new ByteArrayOutputStream((int) FileUtils.sizeOf(file));
        try {
            os.write(new FileInputStream(file));
        } catch (IOException ex) {
            Logger.getLogger(JsonWriter.class.getName()).log(Level.SEVERE, null, ex);
        }
        return encoder.encodeToString(os.toByteArray());
    }
}
