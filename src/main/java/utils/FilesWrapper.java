package utils;

import java.io.*;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.nio.file.*;
import static java.nio.file.StandardOpenOption.*;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.*;

public final class FilesWrapper {

    private static final Logger LOGGER = LoggerFactory.getLogger(FilesWrapper.class);

    public static boolean isHidden(Path path) {
        try {
            return Files.isHidden(path);
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return true;
        }
    }

    public static List<String> list(Path parentDir) {
        try {
            return Files.list(parentDir)
                    .filter(path -> !isHidden(path))
                    .map(path -> path.getFileName().toString())
                    .collect(Collectors.toList());
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return null;
        }
    }
    public static List<String> listFullPath(Path parentDir) {
        try {
            return Files.list(parentDir)
                    .filter(path -> !isHidden(path))
                    .map(path -> path.toString())
                    .collect(Collectors.toList());
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return null;
        }
    }
    public static boolean saveFile(Path filePath, InputStream data) {
        if (!Files.exists(filePath)) {
            ByteBuffer buffer = ByteBuffer.allocate(1024 * 3);
            try (WritableByteChannel wChannel = Files.newByteChannel(filePath, CREATE, WRITE);
                    ReadableByteChannel rChannel = Channels.newChannel(data)) {
                while (rChannel.read(buffer) != -1) {
                    buffer.flip();
                    wChannel.write(buffer);
                    buffer.clear();
                }
            } catch (IOException ex) {
                LOGGER.error(ex.getMessage());
            }
            return true;
        }
        return false;
    }
    public static boolean mkdir(Path dir) {
        try {
            Files.createDirectory(dir);
            return true;
        } catch (IOException ex) {
            LOGGER.error(ex.getMessage());
            return false;
        }
    }
}
