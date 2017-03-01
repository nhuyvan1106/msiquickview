/* global pnnl, d3 */
(function ($) {
// Admin console menu item selection
    $(".admin-console nav input[type='radio'][value]")
            .change(function () {
                $(".account-details-container, .questions-container, .settings")
                        .hide()
                        .filter(this.value)
                        .show();
                // The class name of the admin console menu item that was clicked
                var navItemClass = this.value;
                switch (navItemClass) {
                    case '.account-details-container':
                        $(navItemClass).fadeIn();
                        break;
                    case '.questions-container':
                        loadQuestions();
                        break;
                    case '.settings':
                        loadAppSettings();
                        break;
                }
            });
    // initialize the dropdown menu for account status search box
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
    // initialize the click handler for the user search button
    $(".admin-console #search").click(search);
    $(".admin-console #add-new-question").click(addNewQuestion);
    $('.setting .switch-btn-status').change(function () {
        pnnl.utils.showOverlay(true);
        $.ajax('/msiquickview/app/settings/' + this.id, {
            method: 'PUT',
            data: {value: this.checked},
            success: function () {
                pnnl.utils.removeSpinnerOverlay();
                pnnl.dialog.showToast(null, 'Settings updated successfully');
            },
            error: onError
        });
    });
    $('.thumb').click(function () {
        // The checkbox used to track the status of this switch button
        var switchBtnStatus = this.previousElementSibling;
        switchBtnStatus.checked = !switchBtnStatus.checked;
        $(switchBtnStatus).change();
        if (!switchBtnStatus.checked)
            switchBtnStatus.parentElement.style.backgroundColor = '#bbb';
        else
            switchBtnStatus.parentElement.style.backgroundColor = '#00c0ff';
    });
    function search() {
        pnnl.utils.showOverlay(true);
        // the username to search for
        var searchStr = $('#user-search #username').val();
        if (searchStr) {
            var $accountForSearchStr = $('.account-details-container tbody tr#' + searchStr);
            // if there is already a row corresponding to this account, scroll to it
            if ($accountForSearchStr.length === 1) {
                $accountForSearchStr.addClass('found-account')
                        .get(0)
                        .scrollIntoView();
                setTimeout(function () {
                    $accountForSearchStr.removeClass('found-account');
                }, 5000);
            } else {
                $.ajax('/msiquickview/app/admin/accounts/' + searchStr, {
                    method: 'GET',
                    success: function (account) {
                        pnnl.utils.removeSpinnerOverlay();
                        if (account.found)
                            addNewAccountDetailRow(account, d3.timeFormat('%a, %b %d %Y %H:%M:%S'));
                        else
                            pnnl.dialog.showToast(new Error(''), 'No account associated with the provided username was found');
                    },
                    error: onError
                });
            }
        } else {
            var statusFilter = $('.search-by-status .selected-status').attr('id');
            var excludes = $('.account-details-container tbody tr:not(tr:first-child)')
                    .map(function () {
                        return this.id;
                    })
                    .get();
            $.ajax('/msiquickview/app/admin/accounts', {
                method: 'GET',
                accept: 'application/json',
                data: {
                    statusFilter: statusFilter,
                    excludes: excludes.length > 0 ? excludes.join(',') : ''
                },
                success: function (data) {
                    if (data.payload.length === 0) {
                        pnnl.dialog.showToast(new Error(''), 'No more accounts found');
                        return;
                    }
                    var timeFormatter = d3.timeFormat('%a, %b %d %Y %H:%M:%S');
                    data.payload.forEach(function (account) {
                        addNewAccountDetailRow(account, timeFormatter);
                    });
                    pnnl.utils.removeSpinnerOverlay();
                    document.querySelector('.account-details-container tbody tr#' + data.payload[0].primaryKey).scrollIntoView();
//                $('.admin-console-content .total-user').text($(tableClass + ' tbody tr:not(tr:first-child)').length + '/' + data.total);
                },
                error: onError
            });
        }
    }

    function addNewAccountDetailRow(account, timeFormatter) {
        if (document.querySelector('.account-details-container tbody tr#' + account.primaryKey))
            return;
        var row = document.querySelector('.account-details-container tbody tr:last-child');
        var newRow = row.cloneNode(true);
        newRow.__data__ = account;
        row.parentElement.appendChild(newRow);
        $(newRow).attr('id', account.primaryKey)
                .show()
                .find('.username').text(account.primaryKey)
                .next('.email').text(account.email)
                .next('.status').text(account.status)
                .next('.role').text(account.role)
                /*
                 *  its innerHTML looks like this
                 *  Sat, Jan 14 2017 14:33:01
                 *  <p>(2 days ago)</p>
                 */
                .next('.last-accessed-time').html(timeFormatter(new Date(account.lastAccessedTime)) + '<p>(' + d3.timeDay.count(new Date(account.lastAccessedTime), new Date()) + ' days ago)</p>')
                .next('.actions')
                .find('.btn.edit')
                .click(function () {
                    editAccountDetail(account);
                })
                .next('.btn.delete')
                .click(function () {
                    deleteItem('/msiquickview/app/admin/accounts/' + account.primaryKey, '.account-details-container #' + account.primaryKey);
                });
    }

    function editAccountDetail(accountObj) {
        var body = '<form name="edit-account-details-form" action="" class="edit-account-details-form">\n\
                        <div class="form-group">\n\
                            <label>Username</label>\n\
                            <input type="text" disabled class="form-control" id="username" name="username"/>\n\
                        </div>\n\
                        <div class="form-group">\n\
                            <label for="email">Email</label>\n\
                            <input type="email" class="form-control" id="email" name="email"/>\n\
                        </div>\n\
                        <div class="statuses form-group">\n\
                            <label>Status</label>\n\
                            <div>\n\
                                <a href="" onclick="return false;" class="btn btn-default">\n\
                                    <span id="selected-status"></span>\n\
                                    <i class="fa fa-chevron-down" aria-hidden="true"></i>\n\
                                </a>\n\
                                <ul>\n\
                                    <li id="ACTIVE">ACTIVE</li>\n\
                                    <li id="DISABLED">DISABLED</li>\n\
                                    <li id="LOCKED">LOCKED</li>\n\
                                </ul>\n\
                            </div>\n\
                        </div>\n\
                        <div class="form-group">\n\
                            <label for="role">Role</label>\n\
                            <input type="text" class="form-control" id="role" name="role" disabled/>\n\
                        </div>\n\
                    </form>';
        pnnl.dialog.createDialog("edit-account-details-dialog")
                .setHeaderTitle("Edit Account Details")
                .setCloseActionButton()
                .setPositiveButton("Save",
                        function (dialogId) {
                            pnnl.utils.showOverlay(true);
                            var dialog = this;
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
                            $.ajax("/msiquickview/app/admin/accounts/" + accountObj.primaryKey, options)
                                    .then(function () {
                                        pnnl.utils.removeSpinnerOverlay();
                                        pnnl.dialog.showToast(null, "Account details saved successfully");
                                        $("tr.account-details#" + accountObj.primaryKey + " .email")
                                                .text(newEmail)
                                                .next(".status")
                                                .text(newStatus);
                                        dialog.hide();
                                    })
                                    .catch(onError);
                        })
                .setNegativeButton("Cancel")
                .setDialogBody(body)
                .setOnOpenCallback(function (dialogId) {
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

    function loadQuestions() {
        pnnl.utils.showOverlay(true);
        $.ajax('/msiquickview/app/questions', {
            method: 'GET',
            accept: 'application/json',
            success: populateQuestionTable,
            error: onError
        });
    }
    function populateQuestionTable(data) {
        pnnl.utils.removeSpinnerOverlay();
        var actions = '<td class="actions">\n\
                                        <button class="btn btn-default edit">Edit</button>\n\
                                        <button class="btn btn-danger delete">Delete</button>\n\
                                </td>';
        var joined = d3.select('.questions-container tbody')
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
                        deleteItem("/msiquickview/app/admin/questions/" + dataObj.primaryKey, '.questions-container #' + dataObj.primaryKey);
                    });
        });
    }

    function loadAppSettings() {
        pnnl.utils.showOverlay(true);
        $.ajax('/msiquickview/app/settings', {
            method: 'GET',
            accept: 'application/json',
            success: function (settings) {
                pnnl.utils.removeSpinnerOverlay();
                Object.keys(settings).forEach(function (key) {
                    $('.settings #' + key).prop('checked', settings[key])
                            .parent()
                            .css('background-color', settings[key] ? '#00c0ff' : 'rgb(187, 187, 187)');
                });
            },
            error: onError
        });
    }

    function editQuestion(questionObj) {
        pnnl.dialog.createDialog("edit-question-details-dialog")
                .setHeaderTitle("Edit Question")
                .setCloseActionButton()
                .setPositiveButton("Save",
                        function (dialogId) {
                            pnnl.utils.showOverlay(true);
                            var newQuestion = $(dialogId + " #question").val();
                            var dialog = this;
                            $.ajax("/msiquickview/app/admin/questions/" + questionObj.primaryKey, {"method": "PUT", "data": {question: newQuestion}})
                                    .then(function () {
                                        pnnl.utils.removeSpinnerOverlay();
                                        pnnl.dialog.showToast(null, "Question detail saved successfully");
                                        $("tr.question-details#" + questionObj.primaryKey + " .question").text(newQuestion);
                                        dialog.hide();
                                    })
                                    .catch(onError);
                        })
                .setNegativeButton("Cancel")
                .setDialogBody("<form><input class='form-control' type='text' id='question' value='" + $("tr.question-details#" + questionObj.primaryKey + " .question").text() + "'/><br/></form>")
                .show(true);
    }

    function addNewQuestion() {
        pnnl.dialog.createDialog("add-new-question-dialog")
                .setHeaderTitle("Add A New Question")
                .setCloseActionButton()
                .setPositiveButton("Save",
                        function (dialogId) {
                            if (!pnnl.validation.validateNotEmpty("add-new-question-form"))
                                return;
                            pnnl.utils.showOverlay(true);
                            var dialog = this;
                            var newQuestion = $(dialogId + " #question").val();
                            $.ajax("/msiquickview/app/admin/questions", {"method": "POST", "data": {questionContent: newQuestion}})
                                    .then(function (questionObj) {
                                        pnnl.utils.removeSpinnerOverlay();
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
                                                    deleteItem("/msiquickview/app/admin/questions/" + questionObj.primaryKey, ".questions-container tr.question-details:last-child");
                                                });
                                        dialog.hide();
                                    })
                                    .catch(function () {
                                        dialog.hide();
                                        onError();
                                    });
                        })
                .setNegativeButton("Cancel")
                .setDialogBody("<form name='add-new-question-form'><input class='form-control' type='text' id='question'/><br/></form>")
                .show(true);
    }
    function deleteItem(itemUrl, itemSelector) {
        pnnl.dialog.createDialog('confirm-delete-dialog')
                .setCloseActionButton()
                .setHeaderIcon('fa fa-exclamation-triangle')
                .setDialogBody('Are you sure you want to delete this item?')
                .setPositiveButton('Ok',
                        function () {
                            pnnl.utils.showOverlay(true);
                            var dialog = this;
                            $.ajax(itemUrl, {method: 'DELETE'})
                                    .then(function () {
                                        pnnl.utils.removeSpinnerOverlay();
                                        pnnl.dialog.showToast(null, 'Item deleted successfully');
                                        $(itemSelector).fadeOut(400, function () {
                                            $(this).remove();
                                        });
                                        dialog.hide();
                                    })
                                    .catch(function () {
                                        dialog.hide();
                                        onError();
                                    });
                        }
                )
                .setNegativeButton('Cancel')
                .show(true);
    }

    function onError() {
        pnnl.utils.removeSpinnerOverlay();
        pnnl.dialog.showToast(new Error('Internal Server Error'), 'An error occurred deleting the item. Please check glassfish log for detail');
    }
})(jQuery);