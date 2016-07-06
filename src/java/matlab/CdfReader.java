package matlab;

import com.mathworks.toolbox.javabuilder.*;
import cdf_read.*;
import java.util.HashMap;
import java.util.Map;
import javax.annotation.PreDestroy;
import javax.ejb.Stateful;

/**
 *
 * @author vann363
 */
@Stateful
public class CdfReader {

    private Class1 class1;
    private Map<String, Object[]> resultContainer;

    public CdfReader() throws MWException {
        resultContainer = new HashMap<>();
        class1 = new Class1();
    }

    public Object[] read(String fileName) throws MWException {
        if (!resultContainer.containsKey(fileName))
            resultContainer.put(fileName, class1.cdf_read(5, fileName));
        return resultContainer.get(fileName);
    }

    @PreDestroy
    private void dispose() {
        MWArray.disposeArray(class1);
        class1 = null;
        for(Map.Entry<String, Object[]> entry: resultContainer.entrySet())
            for (Object obj: entry.getValue())
                MWArray.disposeArray(obj);
        resultContainer = null;
        System.out.println("DESTROYING...");
    }

    public String[] getLoadedFileNames() {
        return resultContainer.keySet().toArray(new String[resultContainer.size()]);
    }
}
