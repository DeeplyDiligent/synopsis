// TODO:
//     - Run only once every 6 hours. If the database has been updated less than 6 hours ago, dont run it! (Also tell users about this)

timeouts = [];
function expandAndCheck(subjects) {

    timeToWaitForElements = 30;


    function waitForElement(elementPath, callBack) {
        timeouts.push(elementPath);
        window
            .setTimeout(function () {
                if ($(elementPath).length) {
                    callBack(elementPath, $(elementPath));
                    timeouts.splice(timeouts.indexOf(elementPath), 1);
                    console.log(timeouts);
                } else {
                    waitForElement(elementPath, callBack);
                }
            }, 500)
    }

    function expandall(expandablebranch) {
        if ($("#" + expandablebranch).attr("aria-expanded") === 'false') {
            $("#" + expandablebranch).trigger("click")
            waitForElement('#' + expandablebranch + '_group', function () {
                collapse(expandablebranch);
                $('#' + expandablebranch + '_group')
                    .find('.tree_item')
                    .each(function (i) {
                        expandall($(this).attr("id"));
                    });
            });
        }
    }
    function collapse(expandablebranch) {
        if ($("#" + expandablebranch).attr("aria-expanded") === 'true') {
            $("#" + expandablebranch).trigger("click")
        }
    }

    function progressBar() {
        var progressBarAndCancel = $('#progress-value');
        progressBarAndCancel.html("");
        $('#progress-value').append('<div style="text-align:center" id="progress-bar"></div>')
        var progressBar = $('#progress-bar');
        var timetogo = timeToWaitForElements;
        progressBarAndCancel.append("<br/><button type='button' id='cancel-loading' style='display:block; margin:auto'>Cancel/Change Subjects</button>")
        $('#cancel-loading').click(function(){
            clearTimeout(loadSubjects);
            $('#subjects-div').fadeIn();
            $('#loader').hide();
            clearInterval(progressBarInterval);
        });
        var progressBarInterval = setInterval(function () {
            timetogo -= 0.05;
            if (timetogo <= 0) {
                progressBarAndCancel.html("Progress: 100%");
                clearInterval(progressBarInterval);
            } else {
                progressBar.html("Progress: " + parseFloat(100 - (timetogo * 100 / timeToWaitForElements)).toFixed(2) + "%");
            }
        }, 50);
    }

    if (subjects == null) {
        subjects = [];
    } else {
        $('#subjects-div').hide();
        $('#loader').fadeIn();
        progressBar();
    }
    var subjectsattr = {}
    var value = [];

    navigation.each(function () {
        if ($(this).attr('title') != null && subjects.indexOf($(this).attr('title')) >= 0) {
            console.log('matching subject found');
            console.log(this);
            var expBranch = $(this)
                .parent()
                .attr('id');
            subjectattr = {};
            subjectattr.id = expBranch;
            subjectattr.dateCreated = new Date().getTime();
            subjectattr.expandedname = $(this).attr('title');
            subjectattr.name = $(this)
                .attr('title')
                .substring(0, 7);
            subjectsattr[$(this).attr('title')] = (subjectattr);
            expandall(expBranch);

            // window.setTimeout(function () {     collapse(expBranch);
            // console.log("collapsed" + expBranch); }, 5000) $(this)     .parent()
            // .click(); ids.push(expBranch); waitForElement('#' + expBranch + '_group',
            // function () {     console.log(expBranch);     $('#' + expBranch + '_group')
            // .find('.tree_item')         .each(function (i) {             if
            // ($(this).attr("aria-expanded") === 'false') { $(this).trigger("click")      }
            //         }); $(document).ajaxStop(function () { console.log(ids);
            // ids.forEach(function (val) {             console.log(val);        }); });
            // chrome         .storage         .sync         .set({ MoodleBeast: value    },
            // function () {             // console.log(value);     }); });
        }
    });

    function afterLoad(){
        var loadSubjects = window.setTimeout(function () {
            if ($('.loading').length===0){
                $('#subjects-div').fadeIn();
                $('#loader').hide();
                $('#success-synopsis').show();
                window.setTimeout(function(){
                    $('#success-synopsis').fadeOut();
                },10000); 
    
                subjects.forEach(function (i) {
                    subjectsattr[i]["innerHTML"] = $("#" + subjectsattr[i]["id"])
                        .parent()
                        .children("ul")
                        .html()
                });
    
                chrome
                    .storage
                    .local
                    .set({
                        MoodleBeast: subjectsattr
                    }, function () {
                        console.log('committed innerHTML + other attributes to database:');
                        console.log(subjectsattr);
                    });
            } else {
                afterLoad();
            }
        }, 3000)
    }

    afterLoad();
}

function showSubjectSelector(subjectsSelected) {
    var allSubjects = [];
    id = 0;
    navigation.each(function () {
        if ($(this).attr('title') != null) {
            allSubjects.push({
                "id": $(this).attr('title'),
                text: $(this).attr('title'),
                value: $(this).attr('title')
            });
            id += 1;
        }
    });
    chrome
        .storage
        .local
        .set({
            allSubjectList: allSubjects
        }, function () {});
    $("#loader").hide();
    $('<div id="subjects-div"></div>').appendTo('#synopsis');
    $('#subjects-div').append("<div id='success-synopsis' style='text-align:center; display:none'>&#10004; Data Stored. <a href='" + 
        chrome.extension.getURL('src/page_action/page_action.html') + 
        "'>Click Here</a> to go to Synopsis!</div><br/>");
    $('#subjects-div').append("<div style='text-align:center'>What subjects are you doing this semester?</div><" +
            "br />");
    //VALUE IS DIFFERENT FROM THE THING SHOWN!
    $('#subjects-div').append("<div style='display:table;margin:0 auto;width:100%'><select class='js-example-basic-multip" +
            "le js-states form-control js-programmatic-multi-set-val' id='subjects_select' mu" +
            "ltiple='multiple' name='subjects'></select></div>");
    $('#subjects-div').append("<br/><button type='button' id='saveSelection'style='display:block; margin:auto'>" +
            "Save</button> <br/><br/>");
    $(".js-example-basic-multiple.js-states.form-control").select2({data: allSubjects, width:'100%'});
    $('.js-example-basic-multiple.js-states.form-control').select2();
    $('.js-example-basic-multiple.js-states.form-control')
        .val(subjectsSelected)
        .trigger('change');
        $('.select2-container').attr('style','width:100%!important');

    $("#saveSelection").click(function () {
        $('#subjects-div').hide();
        $('#loader').fadeIn();
        htmlOutput = ($(".js-example-basic-multiple.js-states.form-control").select2('data'));
        selectedSubjects = [];

        htmlOutput.forEach(function (i) {
            selectedSubjects.push(i['text']);
        });

        console.log(selectedSubjects);
        chrome
            .storage
            .local
            .set({
                "subjectsSelected": selectedSubjects
            }, function () {
                expandAndCheck(selectedSubjects);
            });
    });

}

function renderWaitingForPageLoad(){
    synopsisbox = "<div id='synopsis'class='card mb-3' style='padding:20px 20px;display:none;background: radial-gradient(circle, rgba(241,240,255,1) 0%, rgba(228,251,244,1) 100%);box-shadow: inset 0px 0px 6px 0px rgba(0,0,0,0.75);'>"+
    "<div id='logo' style='display: -webkit-box;width: fit-content;margin: auto; margin-bottom: 20px;'><img style='width:40px' "+
    "src='"+chrome.extension.getURL('img/icon.png')+"' /><h1 style='margin-left:25px'>Synopsis</h1></div>"
    +"<div id='app'><div id='loader'><div style='text-align:center'>Please Wait...</div>"
        +"<img style='height:100px; margin:auto; display:block' src=" + chrome.extension.getURL('img/spinner.gif') + 
            " /><div id='progress-value' style='text-align:center'>Loading...</div>" +
            "</div></div></div>"
    $(synopsisbox).insertBefore("#maincontent");
    $('#synopsis').slideDown();
}

function autoCreateNavbar(isCustomisePage){
    $("#app").html("");
    wait = '<h5 id="waitForRedirect" style="text-align:center">Please Wait...Redirecting</h5>';
    $(wait).appendTo('#app');
    console.log(isCustomisePage);
    console.log(navigation.length);
    if (!isCustomisePage){
        //switch to customise page first
        $('#page-header .singlebutton button').last().click()
    } else if(isCustomisePage && navigation.length === 0) {
        //then find session key and add block
        sessKey = $("input[name='sesskey']").first().val();
        window.location = "?bui_addblock&sesskey="+sessKey+ "&bui_addblock=navigation";
    } else if (isCustomisePage && navigation.length != 0) {
        //then go back to non customise page
        $('#page-header .singlebutton button').last().click()
    }

}

function showSetup(){
    startSetupButton = '<div style="text-align:center">Welcome! Please click the button below to start the setup. It will redirect you quite a few times so please be patient.</div>'+
    '<br /><button id="startButton" style="display:block;margin:auto">Start</button>';
    $('#app').html("");
    $(startSetupButton).appendTo('#app');
    $('#startButton').click(function(){
        chrome.storage.local.set({isSettingUp:true},function(){
            $('#page-header .singlebutton button').last().click();
        });
    });
}

chrome
    .extension
    .sendMessage({}, function (response) {
        renderWaitingForPageLoad();
        
        var readyStateCheckInterval = setInterval(function () {
            if (document.readyState === "complete") {
                clearInterval(readyStateCheckInterval);
                //navigation object
                navigation = $("section[role='navigation'] a");
                isCustomisePage = $('#page-header .singlebutton button').html()==="Customise this page"?false:true;
                if (navigation.length === 0|| (isCustomisePage)){
                    // autoCreateNavbar(isCustomisePage);
                    chrome.storage.local.get("isSettingUp", function(data){
                        console.log(data['isSettingUp']);
                        if (data['isSettingUp']){
                            autoCreateNavbar(isCustomisePage);
                        } else {
                            showSetup();
                        }
                     });
                } else {
                    chrome.storage.local.set({isSettingUp:null});
                    chrome.storage.local.get(null, function (result) {
                        subjectsSelected = result['subjectsSelected'];
                        if (subjectsSelected == null) {
                            showSubjectSelector([]);
                        } else if (subjectsSelected != null) {
                            showSubjectSelector(subjectsSelected);
                            expandAndCheck(subjectsSelected);
                        }
                    });
                }

                

            }
        }, 10);
    });
