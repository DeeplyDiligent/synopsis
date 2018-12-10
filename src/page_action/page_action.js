// chrome.storage.onChanged.addListener(function (changes,areaName) {
// console.log("New item in storage");     console.log(changes); })


function downloadSequentially(urls, callback) {
    let index = 0;
    let currentId;
  
    chrome.downloads.onChanged.addListener(onChanged);
  
    next();
  
    function next() {
      if (index >= urls.length) {
        chrome.downloads.onChanged.removeListener(onChanged);
        callback();
        return;
      }
      const url = urls[index];
      index++;
      if (url) {
        chrome.downloads.download({
          url,
        }, id => {
          currentId = id;
        });
      }
    }
  
    function onChanged({id, state}) {
      if (id === currentId && state && state.current !== 'in_progress') {
        next();
      }
    }
}

data = []
chrome
    .storage
    .onChanged
    .addListener(function (changes, namespace) {
        console.log("change recived!");
        chrome
            .storage
            .local
            .get(null, function (result) {
                moodleBeastData = result['MoodleBeast'];
                data = moodleBeastData;
                render(data);
            });
    });

chrome
    .storage
    .local
    .get(null, function (result) {
        moodleBeastData = result['MoodleBeast'];
        console.log(moodleBeastData);
        data = moodleBeastData;
        render(data);
    });

function downloadAllFromId(idOfDiv){
    idOfColumnToDownload = $(idOfDiv).parent().parent().attr('id');

    function listener(downloadItem, suggest){
        suggest({filename:idOfColumnToDownload+'/'+downloadItem.filename, conflictAction:'overwrite'});
        return true;
    }

    
    warning = confirm("It is advised that you turn off 'Ask where to save each file before downloading' before proceeding.\n\n"+
            "This may result in multiple tabs opening. All pdfs, documents and xlsx files will be immediately "+
            "downloaded, but folders will open in a new tab. You will need to click 'download folder'"+
            " in each tab that opens. \n\nAre you sure you would like to continue?");
    $.ajax({url: "https://lms.monash.edu/course/view.php?id=45166", success: function(result){
        notLoggedIn = (result.includes('Since your browser does not support JavaScript'));
        if (notLoggedIn){
            alert('You arent logged in to moodle, please go to moodle and log into your account!');
        }else if(warning){
            chrome.downloads.onDeterminingFilename.addListener(listener);
            $('.fa.fa-download').hide();
            urlsToDownload = []
            $("#"+idOfColumnToDownload+" img[title=\"File\"]").each(function(i, obj) {
                if (obj.currentSrc.includes("pdf")||obj.currentSrc.includes("document")||obj.currentSrc.includes("powerpoint")){
                    urlsToDownload.push(obj.parentNode.href);
                }
            });
            $("#"+idOfColumnToDownload+" img[title=\"Folder\"]").each(function(i, obj) {
                chrome.tabs.create({url: obj.parentNode.href, active: false });
            });
            downloadSequentially(urlsToDownload,function(){
                $('.fa.fa-download').show();
                chrome.downloads.onDeterminingFilename.removeListener(listener);
            });
        }
   }});
}

function render(data) {
    console.log('rendering...');
    // console.log(data);
    if (!(typeof data === 'undefined' || data === null)) {
        $("#mainPopup").html("");

        $(document).ready(function() {
            var isshow = localStorage.getItem('isshow');
            var dataDate = data[Object.keys(data)[0]]['dateCreated'];
            //showing modal for not been updated for ages and updating timestamp
            dateNow = moment(new Date());
            diffDays = moment.duration(dateNow.diff(dataDate)).asDays();
            console.log('hasnt been updated for: '+diffDays);
            // console.log(isshow);
            if (isshow== null) {
                //showing modal on first use
                localStorage.setItem('isshow', 1);
                $('#welcomeModal').modal('show');
            } else if (diffDays>2){
                $('#updateModal').modal('show');
            } else if (localStorage.getItem('updated')){
                //show modal after appUpdate
                $('#appUpdatedModal').modal('show');
                $('#verNo').html(localStorage.getItem('updated'));
                localStorage.setItem('updated','');
            }
            $('#mainPopup').append('<h3 style="display:inline-block">Last Updated '+moment(dataDate).fromNow()+'</h3>&emsp;'+
            '<a span title="Sync all from Moodle" href="https://moodle.vle.monash.edu/my/"><i style="font-size:25px" class="fa fa-refresh" aria-hidden="true"></i></a span>'+'<br/>');
        });

        var column = ""
        column+= "<table style='border-collapse:separate;border-spacing: 10px;margin-top:20px;width:100%'><tr>"
        Object
            .keys(data)
            .forEach(function (key) {
                value = data[key];
                nameOfSubject = value['expandedname'];
                var matches = nameOfSubject.match(/\w{3}\d{4}/g);
                if (matches != null) {
                    nameOfSubject = matches[0];
                }
                encodedSubjectName = encodeURI(nameOfSubject);
                column += "<td style='vertical-align:top' id='"+encodedSubjectName+"'>";
                column += "<h1 style='font-size: 3vw;'>"+nameOfSubject+"&nbsp;<a title=\"Download All Files (*.pdf, *.docx, *.pptx and folders)\" class='downloadWholeSubject' href='#'>"
                +"<i style='font-size:2vw' class='fa fa-download' aria-hidden='true'></i></a></h1>"
                column += value["innerHTML"];
                column += "</td>";

            });
        column+= "</tr></table>";
        $("#mainPopup").append(column);

        //onClick functions
        $('.downloadWholeSubject').on('click',function(){
            downloadAllFromId(this)
        });

        //changing look and opening in new tab
        $(".tree_item.branch").css({display: 'inline-flex'});
        $('#mainPopup td>li>p').css({fontSize:"20px",fontWeight:"bold",color:"black"});
        $('#mainPopup td li').css({listStyle:"none"});
        $('#mainPopup ul>li').css({textIndent:"-2em"});

        //making all icons same size
        $('td img').css({width:"24px"});

        

        Array.prototype.slice.call(document.querySelectorAll("li a")).forEach(function(value){value.setAttribute("target","_blank")});
    } else {
        $("#mainPopup").html("<h1>Thank you for using Synopsis</h1> <p>Please <a href='https://moodle.vle.mona" +
                "sh.edu/my/'>Open Moodle</a> so that we can create your very own database!</p>");
    }
}

