package security.models;

import java.io.Serializable;
import java.util.List;
import javax.persistence.*;
import javax.validation.constraints.*;

@Entity
@Table(name = "security_question")
@NamedQueries({
    @NamedQuery(name = "SecurityQuestion.findAll", query = "SELECT s FROM SecurityQuestion s"),
    @NamedQuery(name = "SecurityQuestion.findById", query = "SELECT s FROM SecurityQuestion s WHERE s.id = :id"),
})
public class SecurityQuestion implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private short id;
    
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 150)
    @Column(name = "question")
    private String question;
    @OneToMany(mappedBy = "securityQuestionId")
    private List<AccountSecurityQuestion> accountSecurityQuestionList;

    public SecurityQuestion() {
    }

    public SecurityQuestion(short id) {
        this.id = id;
    }

    public SecurityQuestion(short id, String question) {
        this.id = id;
        this.question = question;
    }

    public short getId() {
        return id;
    }

    public void setId(short id) {
        this.id = id;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public List<AccountSecurityQuestion> getAccountSecurityQuestionList() {
        return accountSecurityQuestionList;
    }

    public void setAccountSecurityQuestionList(List<AccountSecurityQuestion> accountSecurityQuestionList) {
        this.accountSecurityQuestionList = accountSecurityQuestionList;
    }

    @Override
    public int hashCode() {
        return id;
    }

    @Override
    public boolean equals(Object object) {
        if (!(object instanceof SecurityQuestion)) {
            return false;
        }
        SecurityQuestion other = (SecurityQuestion) object;
        return this.id == other.id;
    }

    @Override
    public String toString() {
        return "security.models.SecurityQuestion[ id=" + id + " ]";
    }
    
}