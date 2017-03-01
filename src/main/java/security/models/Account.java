package security.models;

import java.io.Serializable;
import java.util.List;
import javax.persistence.*;
import static javax.persistence.EnumType.*;
import javax.validation.constraints.*;

/**
 *
 * @author NhuY
 */
@Entity
@Table(name = "account")
@NamedQueries({
    @NamedQuery(name = "Account.findAll", query = "SELECT a FROM Account a"),
    @NamedQuery(name = "Account.findByUsername", query = "SELECT a FROM Account a WHERE a.username = :username"),
    @NamedQuery(name = "Account.findByEmail", query = "SELECT a FROM Account a WHERE a.email = :email")
})
public class Account implements Serializable, Cloneable {

    private static final long serialVersionUID = 2L;

    public enum Status {
        ACTIVE, DISABLED, LOCKED
    }
    
    public enum Role {
        ADMIN, REGULAR
    }
    
    @Id
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 50)
    @Column(name = "username")
    private String username;
    
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 256)
    @Column(name = "password")
    private String password;
    
    @Enumerated(STRING)
    @Basic(optional = false)
    @NotNull
    @Column(name = "user_role")
    private Role userRole;
        
    //@Pattern(regexp="[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", message="Invalid email")//if the field contains email address consider using this annotation to enforce field validation   
    @Pattern(regexp = "[a-zA-Z0-9._]+(?:\\.[a-zA-Z0-9._])*@[a-zA-Z0-9_]+\\.[a-zA-Z0-9]{1,4}")
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 100)
    @Column(name = "email")
    private String email;
    
    @Enumerated(STRING)
    @Basic(optional = false)
    @NotNull
    @Column(name = "status")
    private Status status;
    
    @Basic(optional = false)
    @Size(min = 1, max = 100)
    @Column(name = "salt")
    private String salt;
    
    @Basic(optional = false)
    @Size(min = 1, max = 50)
    @Column(name = "host")
    private String host;
    
    @Basic(optional = false)
    @Column(name = "last_accessed_time")
    private long lastAccessedTime;

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "username", fetch = FetchType.LAZY)
    private List<AccountSecurityQuestion> accountSecurityQuestionList;
    
    public Account() {
        this.status = Status.ACTIVE;
        this.userRole = Role.REGULAR;
        lastAccessedTime = 0;
    }

    public Account(String username) {
        this();
        this.username = username;
    }

    public Account(String username, String password, Role userRole, Status status, String email) {
        this(username);
        this.password = password;
        this.userRole = userRole;
        this.status = status;
        this.email = email;
    }
    public Account(String username, String password, String email) {
        this(username);
        this.password = password;
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getUserRole() {
        return userRole;
    }

    public void setUserRole(Role userRole) {
        this.userRole = userRole;
    }


    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSalt() {
        return salt;
    }

    public void setSalt(String salt) {
        this.salt = salt;
    }

    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host;
    }

    public long getLastAccessedTime() {
        return lastAccessedTime;
    }

    public void setLastAccessedTime(long lastAccessedTime) {
        this.lastAccessedTime = lastAccessedTime;
    }
    
    public List<AccountSecurityQuestion> getAccountSecurityQuestionList() {
        return accountSecurityQuestionList;
    }

    public void setAccountSecurityQuestionList(List<AccountSecurityQuestion> accountSecurityQuestionList) {
        this.accountSecurityQuestionList = accountSecurityQuestionList;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (username != null ? username.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        if (!(object instanceof Account)) {
            return false;
        }
        Account other = (Account) object;
        return this.username.equals(other.username);
    }

    @Override
    public String toString() {
        return "security.models.Account[ username=" + username + " ]";
    }

    @Override
    public Account clone() throws CloneNotSupportedException {
        Account newAccount = new Account(this.username, this.password, this.email);
        newAccount.setHost(this.host);
        newAccount.setSalt(this.salt);
        newAccount.setUserRole(this.userRole);
        newAccount.setStatus(this.status);
        newAccount.setLastAccessedTime(this.lastAccessedTime);
        this.accountSecurityQuestionList.stream().forEach(e -> e.setUsername(newAccount));
        newAccount.setAccountSecurityQuestionList(this.accountSecurityQuestionList);
        return newAccount;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }   
}