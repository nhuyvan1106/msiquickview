package rmi.tasks;

import cdf_read.Class1;
import com.mathworks.toolbox.javabuilder.MWException;
import java.io.Serializable;
import java.util.logging.Level;
import java.util.logging.Logger;
import remote_proxy.Task;

public class CdfHdfReaderTask extends Class1 implements Task<Object[]>, Serializable {

    private final String fileName;

    public CdfHdfReaderTask(String fileName) throws MWException {
        this.fileName = fileName;
    }
    
    @Override
    public Object[] doTask() {
        try {
            return this.cdf_read(5, fileName);
        } catch (MWException ex) {
            Logger.getLogger(CdfHdfReaderTask.class.getName()).log(Level.SEVERE, null, ex);
            return null;
        }
    }
    
}