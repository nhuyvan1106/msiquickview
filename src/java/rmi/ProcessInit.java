package rmi;

import java.io.*;
import java.nio.file.*;
import java.util.logging.*;
import static java.util.stream.Collectors.joining;
import java.util.stream.Stream;

public class ProcessInit {

    public static Process startRMIServer(String WEBINF, int port, String jar) {
        ProcessBuilder pb = new ProcessBuilder();
        Path wd = Paths.get(WEBINF);
        pb.directory(wd.resolve("classes").toFile());
        Path lib = wd.resolve("lib");
        String cp = Stream.of("javabuilder.jar", "remote_proxy.jar", jar)
                .map(e -> lib.resolve(e).toString())
                .collect(joining(File.pathSeparator));
        pb.command("java", "-cp", "." + File.pathSeparator + cp, "rmi.BootStrap", String.valueOf(port));
        try {
            System.setProperty("java.rmi.server.hostname", "localhost");
            Process p = pb.start();
            new Thread(() -> flushIStream(p.getInputStream())).start();
            new Thread(() -> flushIStream(p.getErrorStream())).start();
            return p;
        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
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