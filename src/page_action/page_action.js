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

function sendDataOnline(value){
    if (value){
        console.log('sending data online')
        chrome.storage.local.set({'sendDataOnline':'true'});
    } else {
        chrome.storage.local.set({'sendDataOnline':''});
    }
    
}

function openModal(args){
    // instanciate new modal
    link = args.link;
    var modal = new tingle.modal({
        footer: true,
        stickyFooter: true,
        closeMethods: ['overlay', 'button', 'escape'],
        closeLabel: "Close"
    });
    modal.addFooterBtn('Close Popup', 'tingle-btn tingle-btn--pull-right tingle-btn--secondary', function() {
        // here goes some logic
        modal.close();
    });
    modal.addFooterBtn('Open in New Tab', 'tingle-btn tingle-btn--pull-right tingle-btn--primary', function() {
        window.open(link,'_blank');
        modal.close();
    });

    // set content
    modal.setContent('<div id="modal-content">Please Wait...</div>');    
    // open modal
    modal.open();
    $.ajax({
        url: link,
        context: document.body
    })
    .done(function(data) {
        $('#modal-content').hide();
        $('#modal-content').html('');
        $('#modal-content').append($(data).find('[role*=main]').html())
        $('#modal-content li').css({marginTop:'20px'});
        // $('#modal-content').append($(data).find('[role*=main] .section.main .content').eq(1).html())
        $('#modal-content button').hide();
        //style options
        $('#modal-content table td').css({border:"solid 1px"})
        $('#modal-content table li').css({listStyle:"none"})
        $('#modal-content table th').css({padding:"10px"})
        $('#modal-content table td>span').css({display:"block"})
        $('#modal-content table').css({border:"solid 1px", width:"100%"})
        $('#modal-content table img').css({width:"24px"});
        $('#modal-content iframe').css({width:"100%"});
        $('#modal-content a').attr('target', '_blank');
        //if not logged in
        if(data.includes("postLoginSubmitButton")){
            $('#modal-content').html('<h3>You are not logged in, please log in <a href="https://lms.monash.edu/my/">here</a>!</h3>');
        }
        $('#modal-content').slideDown(500,()=>{modal.checkOverflow();});
    });
}

function nightMode(futureState){
    if (futureState==="night"){
        $('body').css({background:"rgb(35,35,35)"});
        $('#mainPopup').css({color:"white"});
        $('#mainPopup p').css({color:"#66b8ffc7"});
        $('#mainPopup a').css({color:"#66b8ffc7"});
        $('#night-mode').attr('data','night');
        $('#night-mode').attr('title','Day Mode');
        $('#night-mode').find('i').removeClass('fa-moon-o').addClass('fa-sun-o');
        localStorage.setItem('nightMode','true')
    } else if (futureState==="day") {
        $('body').css({background:"white"});
        $('#mainPopup').css({color:"black"});
        $('#mainPopup p').css({color:"#007bff"});
        $('#mainPopup a').css({color:"#007bff"});
        $('#night-mode').attr('data','day');
        $('#night-mode').attr('title','Night Mode');
        $('#night-mode').find('i').removeClass('fa-sun-o').addClass('fa-moon-o');
        localStorage.setItem('nightMode','')
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
                render(data,result);
            });
    });

chrome
    .storage
    .local
    .get(null, function (result) {
        moodleBeastData = result['MoodleBeast'];
        console.log(moodleBeastData);
        data = moodleBeastData;
        render(data,result);
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

function render(data,allresultdata) {
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
            $('#mainPopup').append('<h3 style="display:inline-block">Last Updated '+moment(dataDate).fromNow()+'</h3>'+
            '<a span style="margin-left:10px" data="day" title="Night Mode" id="night-mode" href="#"><i style="font-size:25px" class="fa fa-moon-o" aria-hidden="true"></i></a span>'+
            '<a span style="margin-left:10px" data="day" title="Set Up Cloud Sync" id="cloud-sync" href="#"><i style="font-size:25px" class="fa fa-cloud-upload" aria-hidden="true"></i></a span><br/>');
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
        $('#night-mode').click(function(){
            currentState = ($(this).attr('data'));
            futureState = (currentState==="night")?"day":"night";
            nightMode(futureState);
        });
        $('#cloud-sync').click(function(){
            if (localStorage.getItem('userid')){
                window.open('https://moodlehero.net/app/user/'+localStorage.getItem('userid'))
            } else {
                sendDataOnline("true");
            }
        });

        //if cloud sync enabled
        console.log(allresultdata['sendDataOnline'])
        if (allresultdata['sendDataOnline']){
            $('#cloud-sync').children('i').css({color:"#28a745"});
            $('#cloud-sync').attr('title','Go To Web App');
            $('#cloud-sync').attr('data-on','true');
        }
        //changing look and opening in new tab
        $(".tree_item.branch").css({display: 'inline-flex'});
        $('#mainPopup td>li>p').css({fontSize:"20px",fontWeight:"bold",color:"black"});
        $('#mainPopup td li').css({listStyle:"none"});
        $('#mainPopup ul>li').css({textIndent:"-2em"});
        nightMode(localStorage.getItem('nightMode')?"night":"day");

        //making all icons same size
        $('td img').css({width:"24px",marginRight:"5px"});

        //making all columns same width
        $('tr>td').attr('width',(1/$('tr>td').length)*100);
        
        Array.prototype.slice.call(document.querySelectorAll("li a")).forEach(function(value){value.setAttribute("target","_blank")});
        $("li a").on('click',function(event){
            linkType = $(this).attr('title');
            isGrades = $(this).text().trim() === "Grades";
            if (linkType === "Folder"||linkType==="Quiz"|| linkType ==="Assignment"||linkType==="Forum"||isGrades||linkType==="Page"){
                event.preventDefault();
                openModal({link:$(this).attr('href')});
                return false;
            }
            return true;
        });
    } else {
        $("#mainPopup").html("<h1>Thank you for using Synopsis</h1> <p>Click 'Change Subjects' above to proceed</p>");
    }
}

