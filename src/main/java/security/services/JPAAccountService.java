package security.services;

import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import security.models.Account;

@Stateless
public class JPAAccountService extends DatabaseService<Account> {

    @PersistenceContext(unitName = "MSI_QUICKVIEW_PU")
    private EntityManager em;

    public JPAAccountService() {
        entityClass = Account.class;
    }

    @Override
    protected EntityManager getEntityManager() {
        return em;
    }

}