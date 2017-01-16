/* global pnnl, d3 */

(function ($) {
// Admin console menu item selection
    $(".admin-console nav input[type='radio']")
            .change(function () {
                $(".admin-console-content table")
                        .hide()
                        .filter(this.value)
                        .show();
                // The class name of the admin console menu item that was clicked
                var navItemClass = this.value;
                // Get and populate the data for the table corresponding to the clicked menu item e.g. Manage Users or Manage Questions
                getData(navItemClass)
                        .then(function (data) {
                            populateTable(navItemClass, data);
                        });
            });
    $(".admin-console #add-new-question").click(addNewQuestion);
    $(".admin-console #search").click(search);
    $(".search-by-status > div > a")
            .click(function (event) {
                $(this).next("ul").fadeToggle();
                event.stopImmediatePropagation();
            })
            .next("ul")
            .find("li")
            .click(function () {
                $(".search-by-status .selected-status").attr("id", this.id).text(this.id);
            });
    function getData(selectedNavItem, additionalData) {
        var options = {
            method: "GET"
        };
        switch (selectedNavItem) {
            case ".account-details-container":
                if (additionalData)
                    options.data = additionalData;
                else
                    options.data = {statusFilter: "ALL"};
                var excludes = $(".account-details-container tbody tr:not(tr:first-child)")
                        .map(function () {
                            return this.id;
                        })
                        .get();
                return $.ajax("security/admin/accounts?excludes=" + (excludes.length > 0 ? excludes.join(",") : ""), options);
            case ".questions-container":
                return $.ajax("security/admin/questions", options);
        }
    }
    function populateTable(tableClass, data) {
        if (data.payload.length === 0) {
            pnnl.dialog.showToast(new Error(""), "No more accounts found");
            return;
        }
        switch (tableClass) {
            case ".account-details-container":
                var timeFormatter = d3.timeFormat("%a, %b %d %Y %H:%M:%S");
                data.payload.forEach(function (account) {
                    addNewAccountDetailRow(account, timeFormatter);
                });
//                $(".admin-console-content .total-user").text($(tableClass + " tbody tr:not(tr:first-child)").length + "/" + data.total);
                break;
            case ".questions-container":
                var actions = '<td class="actions">\n\
                                        <button class="btn btn-default edit">Edit</button>\n\
                                        <button class="btn btn-danger delete">Delete</button>\n\
                                </td>';
                var joined = d3.select(tableClass + " tbody")
                        .selectAll("tr")
                        .data(data.payload);
                var tr = joined.enter().append("tr");
                tr.append("td").classed("no", true);
                tr.classed("question-details", true)
                        .append("td")
                        .classed("question", true)
                        .text(function (questionObj) {
                            return questionObj.questionContent;
                        });
                tr.each(function (dataObj) {
                    $(this).append(actions)
                            .attr("id", dataObj.primaryKey)
                            .find(".btn.edit")
                            .click(function () {
                                editQuestion(dataObj);
                            })
                            .next(".btn.delete")
                            .click(function () {
                                deleteItem("security/admin/questions/" + dataObj.primaryKey, tableClass + " #" + dataObj.primaryKey);
                            });
                });
                break;
        }
    }

    function search() {
        // input box
        var searchStr = this.previousElementSibling.previousElementSibling.value;
        if (searchStr) {
            var accountForSearchStr = document.querySelector(".account-details-container tbody tr#" + searchStr);
            if (accountForSearchStr) {
                accountForSearchStr.classList.add("found-account");
                accountForSearchStr.scrollIntoView();
                setTimeout(function () {
                    accountForSearchStr.classList.remove("found-account");
                }, 5000);
            } else
                $.ajax("security/admin/accounts/" + searchStr, {
                    method: "GET",
                    success: function (account) {
                        if (account.found) {
                            addNewAccountDetailRow(account, d3.timeFormat("%a, %b %d %Y %H:%M:%S"));
                        } else
                            pnnl.dialog.showToast(new Error(""), "No account associated with the provided username was found");
                    },
                    error: function () {
                        pnnl.dialog.showToast(new Error("Internal Server Error"), "Internal Server Error");
                    }
                });
        } else {
            var statusFilter = $(".search-by-status .selected-status").attr("id");
            getData(".account-details-container", {statusFilter: statusFilter})
                    .then(function (data) {
                        populateTable(".account-details-container", data);
                    });
        }
    }

    function addNewAccountDetailRow(account, timeFormatter) {
        if (document.querySelector(".account-details-container tbody tr#" + account.primaryKey))
            return;
        var row = document.querySelector(".account-details-container tbody tr:last-child");
        var newRow = row.cloneNode(true);
        newRow.__data__ = account;
        row.parentElement.appendChild(newRow);
        $(newRow).attr("id", account.primaryKey)
                .show()
                .find(".username").text(account.primaryKey)
                .next(".email").text(account.email)
                .next(".status").text(account.status)
                .next(".role").text(account.role)
                /*
                 *  its innerHTML looks like this
                 *  Sat, Jan 14 2017 14:33:01
                 *  <p>(2 days ago)</p>
                 */
                .next(".last-accessed-time").html(timeFormatter(new Date(account.lastAccessedTime)) + "<p>(" + d3.timeDay.count(new Date(account.lastAccessedTime), new Date()) + " days ago)</p>")
                .next(".actions")
                .find(".btn.edit")
                .click(function () {
                    editAccountDetail(account);
                })
                .next(".btn.delete")
                .click(function () {
                    deleteItem("security/admin/accounts/" + account.primaryKey, ".account-details-container #" + account.primaryKey);
                });
    }
    function editAccountDetail(accountObj) {
        var body = "<form name='edit-account-details-form' action='' class='edit-account-details-form'>\n\
                        <div class='form-group'>\n\
                            <label>Username</label>\n\
                            <input type='text' disabled class='form-control' id='username' name='username'/>\n\
                        </div>\n\
                        <div class='form-group'>\n\
                            <label for='email'>Email</label>\n\
                            <input type='email' class='form-control' id='email' name='email'/>\n\
                        </div>\n\
                        <div class='statuses form-group'>\n\
                            <label>Status</label>\n\
                            <div>\n\
                                <a href='' onclick='return false;' class='btn btn-default'>\n\
                                    <span id='selected-status'></span>\n\
                                    <i class='fa fa-chevron-down' aria-hidden='true'></i>\n\
                                </a>\n\
                                <ul>\n\
                                    <li id='ACTIVE'>ACTIVE</li>\n\
                                    <li id='DISABLED'>DISABLED</li>\n\
                                    <li id='LOCKED'>LOCKED</li>\n\
                                </ul>\n\
                            </div>\n\
                        </div>\n\
                        <div class='form-group'>\n\
                            <label for='role'>Role</label>\n\
                            <input type='text' class='form-control' id='role' name='role' disabled/>\n\
                        </div>\n\
                    </form>";
        pnnl.dialog
                .newDialogBuilder()
                .createAlertDialog("edit-account-details-dialog")
                .setHeaderTitle("Edit Account Details")
                .setCloseActionButton()
                .setPositiveButton("Save",
                        function (dialogId) {
                            var newEmail = $(dialogId + " #email").val();
                            var newStatus = $(dialogId + " #selected-status").text();
                            var options = {
                                method: "PUT",
                                contentType: "application/json",
                                data: JSON.stringify({
                                    email: $(dialogId + " #email").val(),
                                    status: newStatus
                                })
                            };
                            $.ajax("security/admin/accounts/" + accountObj.primaryKey, options)
                                    .then(function () {
                                        pnnl.dialog.showToast(null, "Account details saved successfully");
                                        $("tr.account-details#" + accountObj.primaryKey + " .email")
                                                .text(newEmail)
                                                .next(".status")
                                                .text(newStatus);
                                        $(dialogId + " .negative-btn").click();
                                    })
                                    .catch(function (xhr) {
                                        pnnl.dialog.showToast(xhr, "Something went wrong, please try again");
                                    });
                        })
                .setNegativeButton("Cancel")
                .setMessageBody(body)
                .init(function (dialogId) {
                    $(dialogId + " #username").val(accountObj.primaryKey);
                    $(dialogId + " #email").val(accountObj.email);
                    $(dialogId + " #selected-status").text(accountObj.status);
                    $(dialogId + " #role").val(accountObj.role);
                    $(dialogId + " .statuses > div > a")
                            .click(function (event) {
                                event.preventDefault();
                                $(this).next("ul")
                                        .fadeToggle();
                            })
                            .next("ul")
                            .find("li")
                            .click(function () {
                                $(dialogId + " #selected-status").text(this.id);
                                $(this).parent().fadeOut();
                            });
                })
                .show(true);
    }
    function editQuestion(questionObj) {
        pnnl.dialog
                .newDialogBuilder()
                .createAlertDialog("edit-question-details-dialog")
                .setHeaderTitle("Edit Question")
                .setCloseActionButton()
                .setPositiveButton("Save",
                        function (dialogId) {
                            var newQuestion = $(dialogId + " #question").val();
                            $.ajax("security/admin/questions/" + questionObj.primaryKey, {"method": "PUT", "data": {question: newQuestion}})
                                    .then(function () {
                                        pnnl.dialog.showToast(null, "Question detail saved successfully");
                                        $("tr.question-details#" + questionObj.primaryKey + " .question").text(newQuestion);
                                    })
                                    .catch(function (xhr) {
                                        pnnl.dialog.showToast(xhr, "Something went wrong, please try again");
                                    });
                        })
                .setNegativeButton("Cancel")
                .setMessageBody("<form><input class='form-control' type='text' id='question' value='" + $("tr.question-details#" + questionObj.primaryKey + " .question").text() + "'/><br/></form>")
                .show(true);
    }

    function addNewQuestion() {
        pnnl.dialog
                .newDialogBuilder()
                .createAlertDialog("add-new-question-dialog")
                .setHeaderTitle("Add A New Question")
                .setCloseActionButton()
                .setPositiveButton("Save",
                        function (dialogId) {
                            if (!pnnl.validation.validateNotEmpty("add-new-question-form"))
                                return;
                            var newQuestion = $(dialogId + " #question").val();
                            $.ajax("security/admin/questions", {"method": "POST", "data": {questionContent: newQuestion}})
                                    .then(function (questionObj) {
                                        pnnl.dialog.showToast(null, "Question created successfully");
                                        var newNode = document.querySelector(".questions-container tr.question-details:last-child").cloneNode(true);
                                        $(".questions-container tbody")
                                                .append(newNode)
                                                .find("tr:last-child")
                                                .attr("id", questionObj.primaryKey)
                                                .find(".question")
                                                .text(questionObj.questionContent)
                                                .next(".actions")
                                                .find(".btn.edit")
                                                .click(function () {
                                                    editQuestion(questionObj);
                                                })
                                                .next(".btn.delete")
                                                .click(function () {
                                                    deleteItem("security/admin/questions/" + questionObj.primaryKey, ".questions-container tr.question-details:last-child");
                                                });
                                    })
                                    .catch(function (xhr) {
                                        pnnl.dialog.showToast(xhr, "Something went wrong");
                                    });
                        })
                .setNegativeButton("Cancel")
                .setMessageBody("<form name='add-new-question-form'><input class='form-control' type='text' id='question'/><br/></form>")
                .show(true);
    }
    function deleteItem(path, itemSelector) {
        pnnl.dialog
                .newDialogBuilder()
                .createAlertDialog("confirm-delete-dialog")
                .setCloseActionButton()
                .setHeaderIcon("fa fa-exclamation-triangle")
                .setMessageBody("Are you sure you want to delete this item?")
                .setPositiveButton("Ok",
                        function (dialogId) {
                            $.ajax(path, {method: "DELETE"})
                                    .then(function () {
                                        pnnl.dialog.showToast(null, "Item deleted successfully");
                                        $(itemSelector).fadeOut(400, function () {
                                            $(this).remove();
                                        });
                                        $(dialogId + " .btn.negative-btn").click();
                                    })
                                    .catch(function () {
                                        $(dialogId + " .btn.negative-btn").click();
                                        pnnl.dialog.showToast(new Error("Internal Server Error"), "An error occurred deleting the item. Please check developer console (F12)");
                                    });
                        }
                )
                .setNegativeButton("Cancel")
                .show(true);
    }
})(jQuery);