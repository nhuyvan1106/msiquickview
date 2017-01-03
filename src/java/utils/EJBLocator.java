package utils;

import java.util.logging.Level;
import java.util.logging.Logger;
import javax.naming.InitialContext;
import javax.naming.NamingException;

public class EJBLocator {
    private static InitialContext context;
    private static String lookup = "java:global/Java-Matlab-Integration/";
    static {
        try {
            context = new InitialContext();
        } catch (NamingException ex) {
            Logger.getLogger(EJBLocator.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    public enum Type {
        JPAAccountService, JPASecurityQuestionService
    }
    public static <T> T getBean(Type type) throws NamingException {
        switch (type) {
            case JPAAccountService:
                return (T)context.lookup(lookup + "JPAAccountService");
            case JPASecurityQuestionService:
                return (T)context.lookup(lookup + "JPASecurityQuestionService");
            default:
                return null;
        }
    }
}
