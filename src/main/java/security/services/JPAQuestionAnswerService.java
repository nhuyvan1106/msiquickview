package security.services;

import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import security.models.AccountSecurityQuestion;

@Stateless
public class JPAQuestionAnswerService extends DatabaseService<AccountSecurityQuestion> {

    @PersistenceContext(unitName = "MSI_QUICKVIEW_PU")
    private EntityManager em;

    public JPAQuestionAnswerService() {
        entityClass = AccountSecurityQuestion.class;
    }
    
    @Override
    protected EntityManager getEntityManager() {
        return em;
    }

}