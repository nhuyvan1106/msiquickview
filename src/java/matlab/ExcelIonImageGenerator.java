package matlab;

import com.mathworks.toolbox.javabuilder.*;
import java.io.IOException;
import java.rmi.*;
import java.util.*;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.annotation.Resource;
import javax.ejb.Stateless;
import javax.enterprise.concurrent.ManagedScheduledExecutorService;
import javax.inject.Inject;
import resource.ApplicationResource;
import rmi.tasks.ImagesFromExcelTask;
import rmi.ProcessInit;
import rmi.tasks.Tasks;

@Stateless
public class ExcelIonImageGenerator {

    @Inject
    private ApplicationResource resource;

    @Resource(name = "java:comp/DefaultManagedScheduledExecutorService")
    private ManagedScheduledExecutorService pool;

    public void generate(String root, String path, List<String> fileNames, Double[][] ranges) {
        /*Optional<Port> opt = resource.getPorts()
                .stream()
                .filter(p -> !p.isInUse())
                .findFirst();
        Port port = opt.orElseGet(() -> resource.getPorts().get((int) (Math.random() * resource.getPorts().size())));
        Future<Process> process = pool.submit(() -> ProcessInit.startRMIServer(root, port.getPort()));
        port.setInUse(true);
        try {
            ImagesFromExcelTask task = new ImagesFromExcelTask(path, fileNames, ranges);
            Tasks.runTask(task, port.getPort())
                    .thenRun(() -> port.setInUse(false))
                    .thenRun(() -> {
                        System.out.println("ABOUT TO CLOSE PROCESS");
                        try {
                            process.get().destroy();
                        } catch (InterruptedException | ExecutionException ex) {
                            Logger.getLogger(ExcelIonImageGenerator.class.getName()).log(Level.SEVERE, null, ex);
                        }
                        System.out.println("PROCESS CLOSED");
                    });
        } catch (MWException | RemoteException | NotBoundException ex) {
            Logger.getLogger(ExcelIonImageGenerator.class.getName()).log(Level.SEVERE, null, ex);
            port.setInUse(false);
        }*/
    }
}
