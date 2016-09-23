package json;

import com.fasterxml.jackson.core.JsonGenerator;
import java.io.*;
import java.nio.ByteBuffer;
import java.nio.channels.ReadableByteChannel;
import java.nio.file.*;
import static java.nio.file.StandardOpenOption.READ;
import java.util.*;
import java.util.function.Predicate;
import java.util.logging.*;
import java.util.stream.Stream;

public class JsonWriter {

    private JsonWriter() {
    }
    
    public static void writeUserDir(JsonGenerator generator, Path userDir, String datasetName) throws FileNotFoundException {
        Predicate<File> p = null;
        if (!Files.exists(userDir))
            throw new FileNotFoundException("Folder with given name: " + userDir.getFileName() + " does not exist");
        if (datasetName != null && !"".equals(datasetName)) {
            if (!Files.exists(userDir.resolve(datasetName)))
                throw new FileNotFoundException("Dataset with given name: " + datasetName + " does not exist");
            p = file -> file.getName().equals(datasetName);
        } 
        else
            p = file -> true;
        try {
            File[] files = userDir.toFile().listFiles();
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
        } catch (IOException ex) {
            Logger.getLogger(JsonWriter.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    public static void writeImageData(JsonGenerator generator, File path, int skip, int limit) throws IOException {
        Base64.Encoder encoder = Base64.getEncoder();
        generator.writeArrayFieldStart("image-data");
        Arrays.stream(path.listFiles())
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
            writeImageData(generator, new File(dir, "images"), 0, 10);
            generator.writeEndObject();
        } catch (IOException ex) {
            Logger.getLogger(JsonWriter.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    
    public static void listFileNames(JsonGenerator generator, String field, File[] files, int skip, int limit) throws IOException {
        generator.writeArrayFieldStart(field);
        Stream.of(files)
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
        try (ReadableByteChannel rbc = Files.newByteChannel(file.toPath(), READ)) {
            ByteBuffer buffer = ByteBuffer.allocate((int)Files.size(file.toPath()));
            rbc.read(buffer);
            buffer.flip();
            return encoder.encodeToString(buffer.array());
        } catch (IOException ex) {
            Logger.getLogger(JsonWriter.class.getName()).log(Level.SEVERE, null, ex);
            return null;
        }
    }
}