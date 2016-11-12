package json;

import com.fasterxml.jackson.core.JsonGenerator;
import java.io.*;
import java.nio.ByteBuffer;
import java.nio.channels.ReadableByteChannel;
import java.nio.file.*;
import static java.nio.file.FileVisitResult.CONTINUE;
import static java.nio.file.StandardOpenOption.READ;
import java.nio.file.attribute.BasicFileAttributes;
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
            p = dataset -> dataset.getName().equals(datasetName);
        } 
        else
            p = dataset -> true;
        try {
            File[] datasets = userDir.toFile().listFiles();
            generator.writeStartObject();
            listFileNames(generator, "datasets", datasets, 0, Integer.MAX_VALUE);
            generator.writeArrayFieldStart("payload");
            Arrays.stream(datasets)
                    .filter(dataset -> !dataset.isHidden())
                    .filter(p)
                    .limit(1)
                    .forEach(dataset -> writePayloadObject(generator, dataset));
            generator.writeEndArray();
            generator.writeEndObject();
        } catch (IOException ex) {
            Logger.getLogger(JsonWriter.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    public static void writeImageData(JsonGenerator generator, String field, File[] images, int skip, int limit) throws IOException {
        Base64.Encoder encoder = Base64.getEncoder();
        generator.writeArrayFieldStart(field);
        Arrays.stream(images)
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
            /*for (File file : dir.listFiles())
                listFileNames(generator, file.getName(), file.listFiles(), 0, Integer.MAX_VALUE);*/
            Files.walkFileTree(dir.toPath(), new SimpleFileVisitor<Path>() {
                @Override
                public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
                    switch (dir.getFileName().toString()) {
                        case "cdf":
                        case "hdf":
                        case "excel":
                        case "images":
                        case "optical":
                        case "roiImages":
                            listFileNames(generator, dir.getFileName().toString(), dir.toFile().listFiles(), 0, Integer.MAX_VALUE);
                            return CONTINUE;
                        default:
                            return CONTINUE;
                    }
                }             
            });
            writeImageData(generator, "ionImageData", new File(dir, "images").listFiles(), 0, 10);
            writeImageData(generator, "opticalImageData", new File(dir, "optical").listFiles(), 0, 10);
            writeImageData(generator, "roiImageData", new File(dir, "rois/roiImages").listFiles(), 0, 10);
            generator.writeEndObject();
        } catch (IOException ex) {
            Logger.getLogger(JsonWriter.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    
    public static void listFileNames(JsonGenerator generator, String field, File[] files, int skip, int limit) throws IOException {
        generator.writeArrayFieldStart(field);
        if (files.length > 0)
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