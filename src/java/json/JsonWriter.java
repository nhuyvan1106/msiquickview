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
    
    public static void writeUserDir(JsonGenerator generator, String userDir, String datasetName) throws FileNotFoundException {
        Predicate<File> p = null;
        if (!Files.exists(Paths.get(userDir))) {
            userDir = userDir.substring(userDir.indexOf("temp") + 5);
            throw new FileNotFoundException("Folder with given name: " + userDir + " does not exist");
        }
        if (datasetName != null && !"".equals(datasetName)) {
            if (!Files.exists(Paths.get(userDir, datasetName))) {
                throw new FileNotFoundException("Dataset with given name: " + datasetName + " does not exist");
            }
            p = file -> file.getName().equals(datasetName);
        } else {
            p = file -> true;
        }
        try {
            File[] files = new File(userDir).listFiles();
            generator.writeStartObject();
            listFileNames(generator, "datasets", files, 0, Integer.MAX_VALUE);
            generator.writeArrayFieldStart("payload");
            Arrays.stream(files)
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

    public static void writeImageData(JsonGenerator generator, String path, int skip, int limit) throws IOException {
        Base64.Encoder encoder = Base64.getEncoder();
        generator.writeArrayFieldStart("image-data");
        Arrays.stream(new File(path).listFiles())
                .filter(file -> !file.isHidden())
                .skip(skip)
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
                listFileNames(generator, file.getName(), file.listFiles(), 0, Integer.MAX_VALUE);
            writeImageData(generator, dir.toString() + File.separator + "images", 0, 10);
            generator.writeEndObject();
        } catch (IOException ex) {
            Logger.getLogger(JsonWriter.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    
    public static void listFileNames(JsonGenerator generator, String field, File[] files, int skip, int limit) throws IOException {
        generator.writeArrayFieldStart(field);
        Arrays.stream(files)
                .filter(file -> !file.isHidden())
                .skip(skip)
                .limit(limit)
                .map(File::getName)
                .forEach(text -> {
                    try {
                        generator.writeString(text);
                    } catch (IOException ex) {
                        Logger.getLogger(JsonWriter.class.getName()).log(Level.SEVERE, null, ex);
                    }
                });
        generator.writeEndArray();
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
