package rmi;

import java.io.*;
import java.nio.file.*;
import java.util.logging.*;
import static java.util.stream.Collectors.joining;
import java.util.stream.Stream;
import javax.enterprise.concurrent.ManagedExecutorService;
//TODO: Removing log statements
public class ProcessInit {

    public static Process startRMIServer(ManagedExecutorService pool, String WEBINF, int port, String jar) {
        ProcessBuilder pb = new ProcessBuilder();
        Path wd = Paths.get(WEBINF);
        pb.directory(wd.resolve("classes").toFile());
        Path lib = wd.resolve("lib");
        String cp = Stream.of("javabuilder.jar", "remote_proxy.jar", jar)
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
            Logger.getLogger(ProcessInit.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
}