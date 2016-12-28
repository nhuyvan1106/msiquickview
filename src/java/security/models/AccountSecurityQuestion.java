package security.models;

import java.io.Serializable;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Table;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Entity
@Table(name = "account_security_question")
@NamedQueries({
    @NamedQuery(name = "AccountSecurityQuestion.findAll", query = "SELECT a FROM AccountSecurityQuestion a"),
    @NamedQuery(name = "AccountSecurityQuestion.findByUsername", query = "SELECT a FROM AccountSecurityQuestion a WHERE a.username = :username"),
    @NamedQuery(name = "AccountSecurityQuestion.findByQuestionId", query = "SELECT a FROM AccountSecurityQuestion a WHERE a.securityQuestionId = :questionId"),
    @NamedQuery(name = "AccountSecurityQuestion.findById", query = "SELECT a FROM AccountSecurityQuestion a WHERE a.id = :id")})
public class AccountSecurityQuestion implements Serializable {

    private static final long serialVersionUID = 1L;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 50)
    @Column(name = "answer")
    private String answer;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private int id;
    
    @JoinColumn(name = "security_question_id", referencedColumnName = "id")
    @ManyToOne
    private SecurityQuestion securityQuestionId;
    
    @JoinColumn(name = "username", referencedColumnName = "username")
    @ManyToOne(optional = false)
    private Account username;

    public AccountSecurityQuestion() {
    }

    public AccountSecurityQuestion(int id) {
        this.id = id;
    }

    public AccountSecurityQuestion(int id, String answer) {
        this.id = id;
        this.answer = answer;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public SecurityQuestion getSecurityQuestionId() {
        return securityQuestionId;
    }

    public void setSecurityQuestionId(SecurityQuestion securityQuestionId) {
        this.securityQuestionId = securityQuestionId;
    }

    public Account getUsername() {
        return username;
    }

    public void setUsername(Account username) {
        this.username = username;
    }

    @Override
    public int hashCode() {
        return id;
    }

    @Override
    public boolean equals(Object object) {
        if (!(object instanceof AccountSecurityQuestion)) {
            return false;
        }
        AccountSecurityQuestion other = (AccountSecurityQuestion) object;
        return this.id == other.id;
    }

    @Override
    public String toString() {
        return "security.models.AccountSecurityQuestion[ id=" + id + " ]";
    }
}