package rmi;

import java.io.*;
import java.nio.file.*;
import static java.util.stream.Collectors.joining;
import java.util.stream.Stream;
import javax.enterprise.concurrent.ManagedExecutorService;
import org.slf4j.LoggerFactory;
//TODO: Removing log statements
public class ProcessInit {

    public static Process startRMIServer(ManagedExecutorService pool, String WEBINF, int port, String jar) {
        ProcessBuilder pb = new ProcessBuilder();
        Path wd = Paths.get(WEBINF);
        pb.directory(wd.resolve("classes").toFile());
        Path lib = wd.resolve("lib");
        String cp = Stream.of("javabuilder-1.0.0.jar", "remote_proxy-1.0.0.jar", jar)
                .map(e -> lib.resolve(e).toString())
                .collect(joining(File.pathSeparator));
        pb.command("java", "-cp", "." + File.pathSeparator + cp, "rmi.BootStrap", String.valueOf(port));
        while (true) {
            try {
                Process p = pb.start();
                pool.execute(() -> flushIStream(p.getInputStream()));
                pool.execute(() -> flushIStream(p.getErrorStream()));
                return p;
            } catch (Exception ex) {
                ex.printStackTrace();
                System.out.println("Retrying....");
            }
        }
    }

    private static void flushIStream(InputStream is) {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is))) {
            br.lines().forEach(System.out::println);
        } catch (IOException ex) {
            LoggerFactory.getLogger(ProcessInit.class.getName()).error(ex.getMessage());
        }
    }
}