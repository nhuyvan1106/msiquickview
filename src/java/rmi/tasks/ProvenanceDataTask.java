package rmi.tasks;

import com.mathworks.toolbox.javabuilder.MWException;
import java.util.logging.*;
import remote_proxy.Task;
import send_data_to_Proven.Class1;

public class ProvenanceDataTask extends Class1 implements Task<Object[]> {

   /* private String inputNames = "{'ApplicationName'; 'uniqueID'; 'date'; 'scientistName'; 'notes'; 'datasetName'; "
            + "'folderLocation'; 'numRawFiles'; 'rawStartNo'; 'aspectRatio'; 'mzRange'; 'mzPlotVals'; 'mzPlotValsThresh'; "
            + "'normalizeData'; 'applyChangesToAllImages'; 'saveSettings'; 'redoImage'; 'redoImageExcelfileName'; "
            + "'redoImageExcelSheetName'; 'redoImageExcelmzRows'; 'redoImagePDFno'; 'exportPixelsValsToExcel'; "
            + "'alignImage'; 'removeLines'; 'interpolatedDataValues'; 'scaleImageValues'; 'colorMap'; 'saveImage'; "
            + "'imageListToSave'; 'dpiVal'; 'includeAxisImageSave'}";*/
    private String msiQuickViewVersion = "1.0";
    /*private String inputData = "{{'MSI QuickView'; 'A001'; '01/01/16'; 'Julia Laskin'; 'null'; 'null'; 'null'; 'null'; "
            + "'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; "
            + "'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'; 'null'}";*/
    private final String[] variableNames = {"ApplicationName", "uniqueID", "date", "scientistName", "notes", "datasetName", "folderLocation", "numRawFiles", "rawStartNo", "aspectRatio", "mzRange", "mzPlotVals", "mzPlotValsThresh", "normalizeData", "applyChangesToAllImages", "saveSettings", "redoImage", "redoImageExcelfileName", "redoImageExcelSheetName", "redoImageExcelmzRows", "redoImagePDFno", "exportPixelsValsToExcel", "alignImage", "removeLines", "interpolatedDataValues", "scaleImageValues", "colorMap", "saveImage", "imageListToSave", "dpiVal", "includeAxisImageSave"};
    private String[] inputData = {"MSI QuickView", "A001", "01/01/16", "Julia Laskin", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null"};
    //private String[] inputData = {"null", "null", "null", "", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null", "null"};
    public ProvenanceDataTask(String version, String[] inputData) throws MWException {
        this.msiQuickViewVersion = version;
        this.inputData = inputData;
    }
    
    public ProvenanceDataTask(String[] inputData) throws MWException {
        this.inputData = inputData;
    }

    public ProvenanceDataTask() throws MWException {
    }
    
    @Override
    public Object[] doTask() {
        try {
            return this.send_data_to_Proven(msiQuickViewVersion, variableNames, inputData);
        } catch (MWException ex) {
            Logger.getLogger(ProvenanceDataTask.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }
    
}
