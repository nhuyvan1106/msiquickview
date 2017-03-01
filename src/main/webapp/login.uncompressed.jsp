<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE HTML>
<html>
    <head>
        <title>MSI Quickview</title>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <link rel="stylesheet" type="text/css" href="front-end-frameworks/external/bootstrap-3.3.7-dist/css/bootstrap.min.css"/>
        <link rel="stylesheet" type="text/css" href="front-end-frameworks/external/font-awesome-4.7.0/css/font-awesome.min.css"/>
        <script type="text/javascript" src="front-end-frameworks/javascript/pnnl.min.js"></script>
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
                    <a href="" style="text-decoration:underline" id="create-new-account">Create a new account</a>
                    <p style="color:red"><strong>
                            <c:if test="${requestScope.loginFailureMsg != null}">
                                Something went wrong. ${requestScope.loginFailureMsg}
                            </c:if>
                        </strong></p>
                </div>
            </form>
        </div>
        <script>
            (function ($) {
                // TODO Remove
                $(".login-form #username").val(localStorage.getItem("username"));
                $(".login-form #password").val(localStorage.getItem("password"));
                $(document.documentElement).click(function (event) {
                    if (event.target.className.indexOf("selected-question-id") === -1)
                        $(".security-questions-container ul").fadeOut();
                });
                $(".login-form").submit(function (event) {
                    if (!pnnl.validation.validateNotEmpty(this.name)) {
                        event.preventDefault();
                        return;
                    }
                    localStorage.setItem("username", $(".login-form #username").val());
                    localStorage.setItem("password", $(".login-form #password").val());
                });
                animateLabels(".login-form");
                $("#create-new-account").click(function (event) {
                    event.preventDefault();
                    pnnl.utils.showOverlay();
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
                    pnnl.dialog.createDialog("new-account-form-dialog")
                            .setHeaderTitle("Create a new account")
                            .setCloseActionButton()
                            .setPositiveButton("Submit", function (thisDialogId) {
                                if (!pnnl.validation.validateNotEmpty("new-account-form"))
                                    return;
                                if ($(".selected-question-id").attr('id') === 'none') {
                                    pnnl.dialog.showToast(new Error('Security questions not selected'), 'Please select a security question before answering');
                                    return;
                                }
                                else {
                                    var $newAccountForm = $(".new-account-form");
                                    var isFormValid = $newAccountForm.find("input")
                                            .filter(function () {
                                                return this.dataset.state === "valid";
                                            })
                                            .length === $newAccountForm.find("input").length;
                                    if (isFormValid) {
                                        $.ajax("/msiquickview/app/accounts/registration", {
                                            method: "POST",
                                            contentType: "application/json",
                                            data: JSON.stringify({
                                                username: $newAccountForm.find("#new-account-username").val(),
                                                password: $newAccountForm.find("#repeat-password").val(),
                                                email: $newAccountForm.find("#new-account-email").val(),
                                                questions: [
                                                    {id: +$newAccountForm.find("#question-1 .selected-question-id").attr("id"), answer: $newAccountForm.find("#answer-1").val()},
                                                    {id: +$newAccountForm.find("#question-2 .selected-question-id").attr("id"), answer: $newAccountForm.find("#answer-2").val()},
                                                    {id: +$newAccountForm.find("#question-3 .selected-question-id").attr("id"), answer: $newAccountForm.find("#answer-3").val()}
                                                ]
                                            }),
                                            error: function () {
                                                $(thisDialogId + " p strong").text("Something went wrong. Please try again.");
                                                $("input[type='password']").val("").focusout();
                                                setTimeout(
                                                        function () {
                                                            $(thisDialogId + " p strong").text("");
                                                        }
                                                , 5000);
                                            },
                                            success: function () {
                                                window.open("/msiquickview", "_self");
                                            }
                                        });
                                    }
                                }
                            })
                            .setNegativeButton("Cancel")
                            .setDialogBody(body)
                            .setOnOpenCallback(function () {
                                $(".security-questions-container > div > a")
                                        .click(function (event) {
                                            pnnl.utils.filterOutSelectedQuestions(this);
                                            event.stopImmediatePropagation();
                                        })
                                        .find('span')
                                        .attr('id', 'none');
                                pnnl.utils.populateQuestions();
                                animateLabels(".new-account-form");
                                pnnl.validation
                                        .initValidationForInput(".new-account-form #new-account-username", [/^[\w\d.]{1,50}$/g], "Username may contain lowercase and uppercase letters, numbers, periods and underscores. Maximum 50 characters long")
                                        .focusout(function () {
                                            var usernameInputElem = this;
                                            if (usernameInputElem.dataset.state === "valid")
                                                $.ajax("/msiquickview/app/accounts/exists", {
                                                    method: "POST",
                                                    data: {username: usernameInputElem.value},
                                                    success: function () {
                                                        usernameInputElem.setAttribute("data-state", "invalid");
                                                        usernameInputElem.style.border = "2px solid red";
                                                        pnnl.dialog.showHintDialog("hint-dialog", "<span>An account with username <strong>" + usernameInputElem.value + "</strong> already exists</span>", usernameInputElem);
                                                    },
                                                    error: function () {
                                                        usernameInputElem.style.border = "1px solid #ccc";
                                                        usernameInputElem.setAttribute("data-state", "valid");
                                                    }
                                                });
                                        });
                                pnnl.validation.initValidationForInput(".new-account-form #new-account-email", [/[^@]@[^@]/g], "Invalid email format");
                                pnnl.validation.initValidationForInput(".new-account-form #new-account-password", [/[a-z]+/g, /[A-Z]+/g, /\d+/g, /[_!@#$]+/g, /^.{8,100}$/g], "Valid password must contain a combination of lowercase and uppercase letters, numbers, and one or more of these special characters <strong>!</strong>, <strong>@</strong>, <strong>#</strong>, <strong>$</strong>, <strong>_</strong> and be between 8 to 100 characters long.");
                                pnnl.validation.initValidationForInput(".new-account-form #repeat-password", [new RegExp("", "g")], "Passwords don't match", ".new-account-form #new-account-password");
                                pnnl.validation.initValidationForInput(".security-questions-container input", [new RegExp("^[a-zA-Z0-9\\s]{4,}$")], "Valid answer must contain letters, numbers, and spaces only and be at least 4 characters long");
                            })
                            .show(true);
                });
                function animateLabels(formClass) {
                    $(formClass + " input")
                            .focusin(function () {
                                d3.select($(this).prev("label").get(0))
                                        .transition()
                                        .duration(400)
                                        .style("margin-top", "-30px")
                                        .style("color", "black");
                            })
                            .focusout(function () {
                                if (!this.value)
                                    d3.select($(this)
                                            .prev("label")
                                            .get(0))
                                            .transition()
                                            .duration(400)
                                            .style("color", "rgb(205,205,205)")
                                            .style("margin-top", "0px");
                            })
                            .filter(function () {
                                return this.value;
                            })
                            .prev("label")
                            .css("color", "black")
                            .css("margin-top", "-30px");
                }
            })(jQuery);
        </script>
    </body>
</html>