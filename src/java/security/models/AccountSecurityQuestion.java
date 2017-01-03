package security.models;

import java.io.Serializable;
import javax.persistence.*;
import javax.validation.constraints.*;

@Entity
@Table(name = "account_security_question")
@NamedQueries({
    @NamedQuery(name = "AccountSecurityQuestion.findByUsername", query = "SELECT a FROM AccountSecurityQuestion a WHERE a.username = :username"),
    @NamedQuery(name = "AccountSecurityQuestion.findById", query = "SELECT a FROM AccountSecurityQuestion a WHERE a.id = :id")})
public class AccountSecurityQuestion implements Serializable {

    private static final long serialVersionUID = 3L;
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
    
    @JoinColumn(name = "username", referencedColumnName = "username")
    @ManyToOne(optional = false)
    private Account username;

    @Basic(optional = false)
    @Column(name = "security_question_id")
    private short questionId;

    public AccountSecurityQuestion() {
    }
    
    public AccountSecurityQuestion(short questionId, String answer, Account account) {
        this.questionId = questionId;
        this.answer = answer;
        this.username = account;
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

    public short getQuestionId() {
        return questionId;
    }

    public void setQuestionId(short questionId) {
        this.questionId = questionId;
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