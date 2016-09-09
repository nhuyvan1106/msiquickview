package rmi;

import java.rmi.RemoteException;
import java.rmi.registry.*;
import java.rmi.server.UnicastRemoteObject;
import java.util.logging.*;
import remote_proxy.*;

public class BootStrap {

    public static void main(String[] args) {
        int port = Integer.parseInt(args[0]);
        System.out.println("Instantiating a task runner implemenration on port: "  + port );
        try {
            System.setProperty("java.rmi.server.hostname", "localhost");
            TaskRunner runner = new TaskRunnerRemoteObject();
            TaskRunner stub = (TaskRunner)UnicastRemoteObject.exportObject(runner, 0);
            Registry reg = LocateRegistry.createRegistry(port);
            reg.rebind("runner" + port, stub);
        } catch (RemoteException ex) {
            Logger.getLogger(BootStrap.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
}
