package resource;

public final class ApplicationResource {
    
    public static final String FILE_STORAGE_LOCATION = "msi_quickview";

    public static class Settings {

        private static boolean pushImageDataToES = false;

        public static boolean isPushImageDataToES() {
            return pushImageDataToES;
        }

        public static void setPushImageDataToES(boolean newState) {
            pushImageDataToES = newState;
        }
    }

    private ApplicationResource() {
    }
}