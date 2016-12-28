package security.services;

import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import security.models.SecurityQuestion;

@Stateless
public class JPASecurityQuestionService extends DatabaseService<SecurityQuestion> {

    @PersistenceContext(unitName = "Java-Matlab-IntegrationPU")
    private EntityManager em;

    public JPASecurityQuestionService() {
        entityClass = SecurityQuestion.class;
    }
    
    @Override
    protected EntityManager getEntityManager() {
        return em;
    }
    
    
}
