<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE HTML>
<html>
    <head>
        <title>MSI Quickview</title>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <link rel="stylesheet" type="text/css" href="front-end-frameworks/external/bootstrap-3.3.7-dist/css/bootstrap.min.css"/>
        <link rel="stylesheet" type="text/css" href="front-end-frameworks/external/font-awesome-4.6.3/css/font-awesome.min.css"/>
        <script type="text/javascript" src="front-end-frameworks/javascript/pnnl.js"></script>
        <script type="text/javascript" src="front-end-frameworks/external/d3/d3.4.0.0.min.js"></script>
        <script type="text/javascript" src="https://code.jquery.com/jquery-3.1.1.min.js"></script>
        <link rel="stylesheet" type="text/css" href="front-end-frameworks/css/main.css"/>
        <link rel="stylesheet" type="text/css" href="front-end-frameworks/css/login.css"/>
    </head>
    <body>
        <div class="overlay" style="display:none;position:fixed;top:0;width:100%;margin:0;height:100%;z-index:20;background:rgba(0,256,256,0.25)"></div>
        <div>
            <form name="login-form" action="" method="POST" class="login-form">
                <h1>Log in</h1>
                <div class="form-group">
                    <span><i class="fa fa-user fa-lg" aria-hidden="true"></i></span>
                    <label for="username">Username</label>
                    <input type="text" class="form-control" id="username" name="username"/>
                </div>
                <div class="form-group">
                    <span><i class="fa fa-lock fa-lg" aria-hidden="true"></i></span>
                    <label for="password">Password</label>
                    <input type="password" class="form-control" id="password" name="password"/>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-default" id="submit">
                        <i class="fa fa-key" aria-hidden="true" style="transform:rotate(135deg)"></i>
                        Submit
                    </button><br/>
                    <a href="" style="text-decoration:underline" onclick="event.preventDefault()" id="create-new-account">Create a new account</a>
                    <p style="color:red"><strong>
                            <c:if test="${requestScope.loginFailureMsg != null}">
                                Something went wrong. ${requestScope.loginFailureMsg}
                            </c:if>
                        </strong></p>
                </div>
            </form>
        </div>
        <script>
            (function () {
                $(".login-form").submit(function (event) {
                    if (!pnnl.validation.validateNotEmpty(this.name)) {
                        event.preventDefault();
                        return;
                    }
                });
                animateLabels(".login-form");
                $("#create-new-account").click(function() {
                    pnnl.draw.removeSpinnerOverlay();
                    var body = "<form name='new-account-form' action='' class='new-account-form'>" + 
                                    "<div class='form-group'>" + 
                                        "<span><i class='fa fa-user fa-lg' aria-hidden='true'></i></span>" + 
                                        "<label for='new-account-username'>Username</label>" +
                                        "<input type='text' class='form-control' id='new-account-username' name='new-account-username'/>" + 
                                    "</div>" +
                                    "<div class='form-group'>" + 
                                        "<span><i class='fa fa-envelope fa-lg' aria-hidden='true'></i></span>" + 
                                        "<label for='new-account-email'>Email</label>" +
                                        "<input type='email' class='form-control' id='new-account-email' name='new-account-email'/>" + 
                                    "</div>" +
                                    "<div class='form-group'>" + 
                                        "<span><i class='fa fa-lock fa-lg' aria-hidden='true'></i></span>" + 
                                        "<label for='new-account-password'>Password</label>" + 
                                        "<input type='password' class='form-control' id='new-account-password' name='new-account-password'/>" + 
                                    "</div>" +
                                    "<div class='form-group'>" + 
                                        "<span><i class='fa fa-repeat fa-lg' aria-hidden='true'></i></span>" + 
                                        "<label for='repeat-password'>Re-enter Password</label>" + 
                                        "<input type='password' class='form-control' id='repeat-password' name='repeat-password'/>" + 
                                    "</div>" +
                                    "<div class='security-questions-container' id='question-1'>\n\
                                        <div>\n\
                                            <a href='' onclick='return false;' class='btn btn-default'>\n\
                                                <span class='selected-question-id'>Security question 1</span>\n\
                                                <i class='fa fa-chevron-down' aria-hidden='true'></i>\n\
                                            </a>\n\
                                            <ul></ul>\n\
                                        </div>\n\
                                        <input type='text' id='answer-1' class='form-control'/>\n\
                                    </div>" +
                                    "<div class='security-questions-container' id='question-2'>\n\
                                        <div>\n\
                                            <a href='' onclick='return false;' class='btn btn-default'>\n\
                                                <span class='selected-question-id'>Security question 2</span>\n\
                                                <i class='fa fa-chevron-down' aria-hidden='true'></i>\n\
                                            </a>\n\
                                            <ul></ul>\n\
                                        </div>\n\
                                        <input type='text' id='answer-2' class='form-control'/>\n\
                                    </div>" +
                                    "<div class='security-questions-container' id='question-3'>\n\
                                        <div>\n\
                                            <a href='' onclick='return false;' class='btn btn-default'>\n\
                                                <span class='selected-question-id'>Security question 3</span>\n\
                                                <i class='fa fa-chevron-down' aria-hidden='true'></i>\n\
                                            </a>\n\
                                            <ul></ul>\n\
                                        </div>\n\
                                        <input type='text' id='answer-3' class='form-control'/>\n\
                                    </div>" +
                                "</form><p style='color:red'><strong></strong></p>";
                    pnnl.dialog
                            .newDialogBuilder()
                            .createAlertDialog("new-account-form-dialog")
                            .setHeaderTitle("Create a new account")
                            .setCloseActionButton("fa fa-lg fa-close", pnnl.draw.removeSpinnerOverlay)
                            .setPositiveButton("Submit", function(thisDialogId) {
                                if (!pnnl.validation.validateNotEmpty("new-account-form"))
                                    return;
                                else {
                                    var $newAccountForm = $(".new-account-form");
                                    var isFormValid = $newAccountForm.find("input")
                                                        .filter(
                                                            function(index, input) {
                                                                return input.dataset.state === "valid"; 
                                                            }
                                                        )
                                                        .length === $newAccountForm.find("input").length;
                                    // TODO Remove
                                    isFormValid = true;
                                    if (isFormValid) {
                                        $.ajax("/Java-Matlab-Integration/security/accounts",{
                                            method: "POST",
                                            data: {
                                                username:$newAccountForm.find("#new-account-username").val(),
                                                password:$newAccountForm.find("#repeat-password").val(),
                                                email:$newAccountForm.find("#new-account-email").val(),
                                            },
                                            error: function() {
                                                $(thisDialogId + " p strong").text("Something went wrong. Please try again.");
                                                $("input[type='password']").val("").focusout();
                                                setTimeout(
                                                        function() {
                                                            $(thisDialogId + " p strong").text("");
                                                        }
                                                , 5000);
                                            },
                                            success: function() {
                                                window.open("/Java-Matlab-Integration", "_self");
                                            }
                                        });
                                    }
                                }
                            })
                            .setNegativeButton("Cancel", function() {
                                $(".alert-dialog-header-close-action-icon").click();
                            })
                            .setMessageBody(body)
                            .init(function() {
                                $(".security-questions-container > div")
                                    .click(
                                        function(event) {
                                            event.preventDefault();
                                                $(this).find("ul")
                                                        .fadeToggle();
                                        }
                                    );
                                populateQuestions();
                                animateLabels(".new-account-form");
                                $(".new-account-form #new-account-username")
                                    .focusin(
                                        function() {
                                            if (this.dataset.state !== "valid" && document.querySelector("#hint-dialog-" + this.id) === null)
                                                pnnl.dialog.showHintDialog("hint-dialog", "<span>Username can contain letters, numbers, periods and underscores. Maximum 50 characters long</span>", this);
                                        }
                                    )
                                    .focusout(
                                        function() {
                                            var userNameElem = this;
                                            if (validateWithRegex(userNameElem, /[a-z0-9_.]{1,50}/g))
                                                $.ajax("/Java-Matlab-Integration/security/accounts/existing-account", {
                                                    method: "POST",
                                                    data: {username:userNameElem.value},
                                                    error: function() {
                                                        pnnl.dialog.showHintDialog("hint-dialog", "<span>An account with username <strong>"+userNameElem.value+"</strong> already exists</span>", userNameElem);
                                                        userNameElem.removeAttribute("data-state");
                                                        userNameElem.style.border = "2px solid red";
                                                    },
                                                    success: function() {
                                                        userNameElem.setAttribute("data-state", "valid");
                                                        $("#hint-dialog-" + userNameElem.id).remove();
                                                        userNameElem.style.border = "2px solid rgba(200, 200, 200, 0.5)";
                                                    }
                                                }); 
                                        }
                                    );
                                $(".new-account-form #new-account-email")
                                    .focusin(
                                        function() {
                                            showInputEntryHint(this, "Please enter a valid email address");
                                        }
                                    )
                                    .focusout(
                                        function() {
                                            validateWithRegex(this, /[a-zA-Z0-9._]+(?:\.[a-zA-Z0-9._])*@[a-zA-Z0-9_]+\.[a-zA-Z0-9]{1,4}/);
                                        }
                                    );
                                
                                $(".new-account-form #new-account-password")
                                    .focusin(
                                        function() {
                                            showInputEntryHint(this, "Valid password must contain a combination of letters, numbers, and these special characters <strong>!</strong>, <strong>@</strong>, <strong>#</strong>, <strong>$</strong>, <strong>_</strong> and be between 8 to 100 characters long.");
                                        }
                                    )
                                    .focusout(
                                        function() {
                                            validateWithRegex(this, /(?:[\w\d!@#$][\w\d!@#$]){8,100}/);
                                        }
                                    );
                            
                                $(".new-account-form #repeat-password")
                                    .focusout(
                                        function() {
                                            showInputEntryHint(this, "Passwords don't match");
                                            validateWithRegex(this, new RegExp($(".new-account-form #new-account-password").val()));
                                        }
                                    );
                                
                                $(".security-questions-container input")
                                    .focusout(
                                        function() {
                                            showInputEntryHint(this, "Valid answer must contain letters, numbers, and spaces only and be at least 4 characters long");
                                            validateWithRegex(this, new RegExp("[a-zA-Z0-9\\s]{4,}"));
                                        }
                                    );
                            })
                            .show(
                                function(id) {
                                    pnnl.draw.drawOverlay();
                                    $(id).fadeIn().css("top", "2%");
                                }
                            );
                });
                //Display a pop up with a hint when user's entry does not match the validation rule
                function showInputEntryHint(inputElem, hintMsg) {
                    if (inputElem.dataset.state !== "valid" && document.querySelector("#hint-dialog-" + inputElem.id) === null)
                        pnnl.dialog.showHintDialog("hint-dialog", "<span>" + hintMsg + "</span>", inputElem);
                }
                //Initialize the animation behaviour on each input field that has a label immediately preceeding it
                function animateLabels(formClass) {
                    $(formClass + " input")
                        .focusin(
                            function() {
                                d3.select($(this).prev("label").get(0))
                                        .transition()
                                        .duration(400)
                                        .style("margin-top", "-30px")
                                        .style("color", "black");
                            }
                        )
                        .focusout(
                            function() {
                                if (!this.value)
                                    d3.select($(this).prev("label").get(0))
                                        .transition()
                                        .duration(400)
                                        .style("color","rgb(205,205,205)")
                                        .style("margin-top", "0px");
                            }
                        );
                }
                function validateWithRegex(inputElem, regex) {
                    if (regex.test(inputElem.value)) {
                        $("#hint-dialog-" + inputElem.id).remove();
                        inputElem.setAttribute("data-state", "valid");
                        inputElem.style.border = "2px solid rgba(200, 200, 200, 0.5)";
                        return true;
                    }
                    else {
                        inputElem.removeAttribute("data-state");
                        inputElem.style.border = "2px solid red";
                        return false;
                    }
                }
                // Call to populate each security questions selection menu when new account
                // creation form is opened by making an ajax call to the back end.
                function populateQuestions() {
                    $.ajax("/Java-Matlab-Integration/security/questions", {
                        method: "GET",
                        Accept: "application/json",
                        success: function(questionObj) {
                            //var questions = JSON.parse(questionObj);
                            var uls = document.querySelectorAll(".security-questions-container ul");
                            uls.forEach(
                                    function(ul) {
                                        var joined = d3.select(ul)
                                                .selectAll("li")
                                                .data(Object.keys(questionObj))
                                                .attr("id", function(key) { return key; })
                                                .text(function(key) { return questionObj[key]; });
                                        joined.enter()
                                                .append("li")
                                                .attr("id", function(key) { return key; })
                                                .text(function(key) { return questionObj[key]; })
                                                .on("click", function(key) {
                                                    $(this).parents(".security-questions-container")
                                                        .find("div")
                                                        .attr("title", this.innerHTML)
                                                        .find(".selected-question-id")
                                                        .attr("id", key)
                                                        .text(this.innerHTML);
                                                });
                                    }
                            );
                        },
                        error: console.error
                    });
                }
            })();
        </script>
    </body>
</html>

