package rmi.tasks;

import java.rmi.*;
import java.rmi.registry.*;
import java.util.Random;
import java.util.concurrent.*;
import java.util.logging.*;
import javax.enterprise.concurrent.ManagedExecutorService;
import remote_proxy.*;
import rmi.ProcessInit;

public final class Tasks {

    /**
     * @param pool This instance should be injected using @Resource(name = "java:comp/DefaultManagedExecutorService")
     * @param task This is an implementation of the Task interface, this
     *             implementation should extend from MATLAB class and accept any necessary
     * arguments, e.g Class1 and it must implement Serializable interface
     * @param WEBINF WEB-INF directory
     * @param jar  Name of the jar that contains this MATLAB function
     * @throws RemoteException
     * @throws NotBoundException
     */
    public static final <T> T runTask(ManagedExecutorService pool, Task<T> task, String WEBINF, String jar) throws RemoteException, NotBoundException {
        int port = new Random().nextInt(1000) + 2000;
        Future<Process> process = pool.submit(() -> ProcessInit.startRMIServer(WEBINF, port, jar));
        Registry reg = LocateRegistry.getRegistry(port);
        TaskRunner generator = (TaskRunner) reg.lookup("runner" + port);
        T result = generator.runTask(task);
        destroyProcess(process);
        return result;
    }

    private static void destroyProcess(Future<Process> process) {
        try {
            System.out.println("KILLING THIS PROCESS");
            process.get().destroy();
            System.out.println("DONE KILLING THIS PROCESS");
        } catch (InterruptedException | ExecutionException ex) {
            Logger.getLogger(Tasks.class.getName()).log(Level.SEVERE, null, ex);
            System.out.println("DONE KILLING THIS PROCESS");
        }
    }
}